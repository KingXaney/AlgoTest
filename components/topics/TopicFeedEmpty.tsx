'use client';

import {useTransition} from "react";
import {toast} from "sonner";
import {Loader2} from "lucide-react";
import {useTopicsUi} from "@/components/topics/TopicsShell";
import {requestTopicRefreshAction} from "@/lib/actions/topics.actions";

const mono = {fontFamily: 'var(--type-mono)'} as const;

// Empty feed for one topic (buttons) or for the merged view (text only).
const TopicFeedEmpty = ({topic}: {topic?: TopicOverviewItem}) => {
    const {openComposer} = useTopicsUi();
    const [pending, startTransition] = useTransition();

    const refresh = () => topic && startTransition(async () => {
        const result = await requestTopicRefreshAction(topic.id);
        if (result.success) toast.success(result.message ?? 'Refresh queued');
        else toast.error(result.message ?? 'Could not refresh');
    });

    return (
        <section className="glass-panel rounded-xl p-8 text-center">
            <span className="material-symbols-outlined text-3xl text-fg-muted">manage_search</span>
            <h3 className="mt-2 text-base font-semibold text-fg" style={{fontFamily: 'var(--type-display)'}}>No articles yet</h3>
            <p className="mt-1 text-sm text-fg-muted max-w-md mx-auto">
                We check for matches every few hours. {topic ? 'Refresh now or broaden the keywords.' : 'Your topics will fill in as new articles arrive.'}
            </p>
            {topic && (
                <div className="mt-4 flex justify-center gap-2" style={mono}>
                    <button type="button" onClick={refresh} disabled={pending}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-[0.1em] bg-brand text-on-brand disabled:opacity-50">
                        {pending && <Loader2 className="size-3.5 animate-spin" />}
                        Refresh now
                    </button>
                    <button type="button" onClick={() => openComposer('edit', topic)}
                            className="px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-[0.1em] text-fg-soft hover:text-fg border border-line-strong/40">
                        Edit keywords
                    </button>
                </div>
            )}
        </section>
    );
};

export default TopicFeedEmpty;
