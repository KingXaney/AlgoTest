'use server';

import {revalidatePath} from "next/cache";
import {isValidObjectId} from "mongoose";
import {connectToDatabase} from "@/database/mongoose";
import Topic, {type TopicDoc} from "@/database/models/topic.model";
import TopicArticle from "@/database/models/topic-article.model";
import {getCurrentUserId} from "@/lib/actions/watchlist.actions";
import {MAX_TOPICS_PER_USER, REFRESH_COOLDOWN_MS} from "@/lib/topics/config";
import {deriveKeywords, formatIssue, keywordSetHash, slugify, topicInputSchema} from "@/lib/topics/normalize";
import {requestTopicRefresh} from "@/lib/topics/events";
import {getTopicArticles, toTopicView} from "@/lib/topics/store";

export type TopicResult = OrderResult & {topic?: TopicView};
export type TopicFeedPageResult = {success: boolean; message?: string; articles: TopicArticleView[]};

const FEED_PAGE_MAX = 50;

const revalidateTopics = () => {
    revalidatePath('/topics');
    revalidatePath('/');
};

const parseInput = (input: unknown) => {
    const parsed = topicInputSchema.safeParse(input);
    if (!parsed.success) return {error: formatIssue(parsed.error)} as const;
    const derived = deriveKeywords(parsed.data);
    if (!derived) return {error: 'Add at least one keyword to match articles against.'} as const;
    return {value: parsed.data, derived} as const;
};

export const createTopic = async (input: unknown): Promise<TopicResult> => {
    const userId = await getCurrentUserId();
    if (!userId) return {success: false, message: 'Not authenticated'};

    const parsed = parseInput(input);
    if ('error' in parsed) return {success: false, message: parsed.error};
    const {value, derived} = parsed;

    try {
        await connectToDatabase();
        if ((await Topic.countDocuments({userId})) >= MAX_TOPICS_PER_USER) {
            return {success: false, message: `You can follow up to ${MAX_TOPICS_PER_USER} topics. Remove one to add another.`};
        }
        const slug = slugify(value.name);
        if (await Topic.exists({userId, slug})) {
            return {success: false, message: `You already follow a topic called "${value.name}".`};
        }
        const hash = keywordSetHash(derived.keywords, derived.exclude);
        const doc = await Topic.create({
            userId,
            name: value.name,
            slug,
            keywords: derived.keywords,
            exclude: derived.exclude,
            color: value.color ?? undefined,
            keywordSetHash: hash,
        });
        await requestTopicRefresh(userId, hash);
        revalidateTopics();
        return {success: true, topic: toTopicView(doc.toObject())};
    } catch (error) {
        console.error('Error creating topic:', error);
        return {success: false, message: 'Could not create the topic'};
    }
};

export const updateTopic = async (topicId: string, input: unknown): Promise<TopicResult> => {
    const userId = await getCurrentUserId();
    if (!userId) return {success: false, message: 'Not authenticated'};
    if (!isValidObjectId(topicId)) return {success: false, message: 'Unknown topic'};

    const parsed = parseInput(input);
    if ('error' in parsed) return {success: false, message: parsed.error};
    const {value, derived} = parsed;

    try {
        await connectToDatabase();
        const existing = await Topic.findOne({_id: topicId, userId});
        if (!existing) return {success: false, message: 'Unknown topic'};

        const slug = slugify(value.name);
        if (slug !== existing.slug && await Topic.exists({userId, slug})) {
            return {success: false, message: `You already follow a topic called "${value.name}".`};
        }
        const hash = keywordSetHash(derived.keywords, derived.exclude);
        const keywordsChanged = hash !== existing.keywordSetHash;

        const update: Record<string, unknown> = {
            $set: {name: value.name, slug, keywords: derived.keywords, exclude: derived.exclude, keywordSetHash: hash, color: value.color ?? null},
        };
        // A new keyword set means a new feed: the old brief no longer describes it.
        if (keywordsChanged) update.$unset = {brief: 1, lastFetchedAt: 1};
        const doc = await Topic.findOneAndUpdate({_id: topicId, userId}, update, {new: true});
        if (!doc) return {success: false, message: 'Unknown topic'};

        if (keywordsChanged) await requestTopicRefresh(userId, hash);
        revalidateTopics();
        return {success: true, topic: toTopicView(doc.toObject())};
    } catch (error) {
        console.error('Error updating topic:', error);
        return {success: false, message: 'Could not update the topic'};
    }
};

export const deleteTopic = async (topicId: string): Promise<OrderResult> => {
    const userId = await getCurrentUserId();
    if (!userId) return {success: false, message: 'Not authenticated'};
    if (!isValidObjectId(topicId)) return {success: false, message: 'Unknown topic'};

    try {
        await connectToDatabase();
        const doc = await Topic.findOneAndDelete({_id: topicId, userId});
        if (!doc) return {success: false, message: 'Unknown topic'};
        // Articles are shared per keyword set; drop them only when nobody follows the set any more.
        if (!(await Topic.exists({keywordSetHash: doc.keywordSetHash}))) {
            await TopicArticle.deleteMany({keywordSetHash: doc.keywordSetHash});
        }
        revalidateTopics();
        return {success: true};
    } catch (error) {
        console.error('Error deleting topic:', error);
        return {success: false, message: 'Could not remove the topic'};
    }
};

export const markTopicSeen = async (topicId: string): Promise<OrderResult> => {
    const userId = await getCurrentUserId();
    if (!userId) return {success: false, message: 'Not authenticated'};
    if (!isValidObjectId(topicId)) return {success: false, message: 'Unknown topic'};
    try {
        await connectToDatabase();
        await Topic.updateOne({_id: topicId, userId}, {$set: {lastSeenAt: new Date()}});
        return {success: true};
    } catch (error) {
        console.error('Error marking topic seen:', error);
        return {success: false, message: 'Could not update the topic'};
    }
};

// Atomic 10-minute claim before queueing, so a replayed request is bounded here
// as well as by the job's own rate limit.
export const requestTopicRefreshAction = async (topicId: string): Promise<OrderResult> => {
    const userId = await getCurrentUserId();
    if (!userId) return {success: false, message: 'Not authenticated'};
    if (!isValidObjectId(topicId)) return {success: false, message: 'Unknown topic'};
    try {
        await connectToDatabase();
        const cutoff = new Date(Date.now() - REFRESH_COOLDOWN_MS);
        const claimed = await Topic.findOneAndUpdate(
            {_id: topicId, userId, $or: [{refreshRequestedAt: {$exists: false}}, {refreshRequestedAt: {$lte: cutoff}}]},
            {$set: {refreshRequestedAt: new Date()}},
            {new: true},
        ).lean<TopicDoc | null>();
        if (!claimed) {
            const exists = await Topic.exists({_id: topicId, userId});
            return exists
                ? {success: false, message: 'Refreshed recently — try again in a few minutes.'}
                : {success: false, message: 'Unknown topic'};
        }
        await requestTopicRefresh(userId, claimed.keywordSetHash);
        return {success: true, message: 'Refresh queued — new articles land in a moment.'};
    } catch (error) {
        console.error('Error requesting topic refresh:', error);
        return {success: false, message: 'Could not refresh the topic'};
    }
};

// "Load more" for the feed; session-scoped so one user can't page another's topic.
export const fetchTopicFeedPage = async (
    {topicId, before, limit = 20}: {topicId: string; before?: number; limit?: number},
): Promise<TopicFeedPageResult> => {
    const userId = await getCurrentUserId();
    if (!userId) return {success: false, message: 'Not authenticated', articles: []};
    if (!isValidObjectId(topicId)) return {success: false, message: 'Unknown topic', articles: []};
    try {
        await connectToDatabase();
        const topic = await Topic.findOne({_id: topicId, userId}).select('keywordSetHash').lean<Pick<TopicDoc, 'keywordSetHash'> | null>();
        if (!topic) return {success: false, message: 'Unknown topic', articles: []};
        const safeLimit = Math.max(1, Math.min(FEED_PAGE_MAX, Math.floor(limit)));
        const articles = await getTopicArticles(topic.keywordSetHash, {limit: safeLimit, before});
        return {success: true, articles};
    } catch (error) {
        console.error('Error loading topic feed page:', error);
        return {success: false, message: 'Could not load more articles', articles: []};
    }
};
