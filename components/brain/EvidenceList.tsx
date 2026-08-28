import {cn, formatTimeAgo, getChangeColorClass} from "@/lib/utils";

export type EvidenceItem = {
    headline: string;
    source: string;
    sourceType: string;
    url: string;
    datetime: number;
    publishedDate: string;
    sentiment: number;
    relevance: number;
};

// Per-entity evidence drill-down: the actual articles behind a narrative's weight.
const EvidenceList = ({entityKey, items}: {entityKey: string; items: EvidenceItem[]}) => (
    <div>
        <p className="text-xs text-fg-muted mb-3" style={{fontFamily: 'var(--type-mono)'}}>
            Evidence for <span className="text-brand">{entityKey}</span> · last 21 days
        </p>
        {items.length === 0 ? (
            <p className="text-sm text-fg-muted">No recent articles mention this entity.</p>
        ) : (
            <div className="space-y-2">
                {items.map((item) => (
                    <a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer"
                       className="block px-4 py-3 rounded-lg border bg-surface-2/40 border-line-strong/20 hover:border-brand/30 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                            <span className="text-sm text-fg">{item.headline}</span>
                            <span className={cn('text-xs shrink-0', getChangeColorClass(item.sentiment || undefined))}
                                  style={{fontFamily: 'var(--type-mono)'}}>
                                {item.sentiment >= 0 ? '+' : ''}{item.sentiment.toFixed(2)}
                            </span>
                        </div>
                        <div className="text-[11px] text-fg-muted mt-1" style={{fontFamily: 'var(--type-mono)'}}>
                            {item.source} · {formatTimeAgo(item.datetime)}
                            {item.sourceType === 'reddit' && <span className="ml-2 text-negative">community sentiment</span>}
                        </div>
                    </a>
                ))}
            </div>
        )}
    </div>
);

export default EvidenceList;
