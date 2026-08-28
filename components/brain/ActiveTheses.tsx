import {cn, getChangeColorClass} from "@/lib/utils";

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

// Same pattern as formatTimeAgo — time-relative display computed in a helper.
const weeksActive = (thesisSince: number | null): number =>
    thesisSince ? Math.max(1, Math.round((Date.now() - thesisSince) / MS_PER_WEEK)) : 0;

// The centerpiece of /brain: narratives whose SLOW-layer weight has sustained above
// the thesis threshold — "where the market's favor has been shifting for weeks".
const ActiveTheses = ({theses}: {theses: BrainEntitySummary[]}) => {
    if (theses.length === 0) {
        return (
            <p className="text-sm text-fg-muted">
                No active theses yet. A narrative becomes a thesis once it keeps accumulating
                attention for several weeks — check back as the brain ingests more news.
            </p>
        );
    }

    return (
        <div className="space-y-1.5">
            {theses.map((t) => {
                const weeks = weeksActive(t.thesisSince);
                return (
                    <div key={t.key}
                         className="flex items-center justify-between px-4 py-3 rounded-lg border bg-surface-2/40 border-brand/15">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-base text-brand">trending_up</span>
                            <div>
                                <span className="text-sm font-semibold text-fg" style={{fontFamily: 'var(--type-display)'}}>
                                    {t.displayName}
                                </span>
                                <div className="text-[10px] uppercase tracking-[0.08em] text-fg-muted" style={{fontFamily: 'var(--type-mono)'}}>
                                    {t.type} · active {weeks} {weeks === 1 ? 'week' : 'weeks'}
                                </div>
                            </div>
                        </div>
                        <div className="text-right" style={{fontFamily: 'var(--type-mono)'}}>
                            <div className="text-sm text-fg">weight {t.weightSlow.toFixed(1)}</div>
                            <div className={cn('text-xs', getChangeColorClass(t.sentimentSlow || undefined))}>
                                sentiment {t.sentimentSlow >= 0 ? '+' : ''}{t.sentimentSlow.toFixed(2)}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ActiveTheses;
