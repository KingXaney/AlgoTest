import {inngest} from "@/lib/inngest/client";

export const TOPIC_REFRESH_EVENT = 'topic/refresh.requested';
export const TOPIC_FEEDS_EVENT = 'app/refresh.topic.feeds';
export const TOPIC_BRIEFS_EVENT = 'app/generate.topic.briefs';

// Best effort: a queue outage must never fail the user's action.
export const requestTopicRefresh = async (userId: string, keywordSetHash: number): Promise<void> => {
    try {
        await inngest.send({name: TOPIC_REFRESH_EVENT, data: {userId, keywordSetHash}});
    } catch (error) {
        console.error('Failed to queue topic refresh:', error);
    }
};
