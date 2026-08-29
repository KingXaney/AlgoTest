import {redirect} from "next/navigation";
import {getCurrentUserId} from "@/lib/actions/watchlist.actions";
import {getMergedTopicFeed, getTopicsOverview} from "@/lib/topics/store";
import {getTopEntities} from "@/lib/brain/queries";
import {suggestKeywords} from "@/lib/topics/suggest-keywords";
import TopicsShell from "@/components/topics/TopicsShell";
import AllTopicsHeader from "@/components/topics/AllTopicsHeader";
import TopicFeed from "@/components/topics/TopicFeed";
import TopicFeedEmpty from "@/components/topics/TopicFeedEmpty";
import TopicsEmptyState, {type SuggestedTopic} from "@/components/topics/TopicsEmptyState";

const MERGED_FEED_SIZE = 24;
const BRAIN_SUGGESTIONS = 6;

// Themes and sectors the brain is already tracking make good first topics.
const brainSuggestions = async (): Promise<SuggestedTopic[]> => {
    try {
        const top = await getTopEntities(BRAIN_SUGGESTIONS);
        return [...top.theme, ...top.sector]
            .slice(0, BRAIN_SUGGESTIONS)
            .map((e) => ({name: e.displayName, keywords: suggestKeywords(e.displayName)}))
            .filter((s) => s.keywords.length > 0);
    } catch (error) {
        console.error('Brain suggestions unavailable:', error);
        return [];
    }
};

const TopicsPage = async () => {
    const userId = await getCurrentUserId();
    if (!userId) redirect('/sign-in');

    const overview = await getTopicsOverview(userId);
    if (overview.topics.length === 0) {
        return <TopicsEmptyState brainSuggestions={await brainSuggestions()} />;
    }

    const articles = await getMergedTopicFeed(userId, {limit: MERGED_FEED_SIZE});

    return (
        <TopicsShell overview={overview}>
            <AllTopicsHeader count={overview.topics.length} unseenTotal={overview.unseenTotal} />
            {articles.length > 0
                ? <TopicFeed initial={articles} showTopicTag pageSize={MERGED_FEED_SIZE} />
                : <TopicFeedEmpty />}
        </TopicsShell>
    );
};

export default TopicsPage;
