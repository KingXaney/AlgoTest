import Link from "next/link";
import {cn, getChangeColorClass} from "@/lib/utils";

const TypeColumn = ({title, entities}: {title: string; entities: BrainEntitySummary[]}) => (
    <div>
        <h3 className="text-[10px] uppercase tracking-[0.14em] text-fg-muted mb-2" style={{fontFamily: 'var(--type-mono)'}}>
            {title}
        </h3>
        {entities.length === 0 ? (
            <p className="text-xs text-fg-muted">Nothing yet</p>
        ) : (
            <div className="space-y-1">
                {entities.map((e) => (
                    <Link key={e.key} href={`/brain?entity=${encodeURIComponent(e.key)}`}
                          className="flex items-center justify-between px-3 py-2 rounded-lg border bg-surface-2/40 border-line-strong/20 hover:border-brand/30 transition-colors">
                        <span className="text-xs font-semibold text-fg truncate max-w-[55%]" style={{fontFamily: 'var(--type-mono)'}}>
                            {e.displayName}
                            {e.thesisSince !== null && <span className="ml-1 text-brand">●</span>}
                        </span>
                        <span className="text-[11px]" style={{fontFamily: 'var(--type-mono)'}}>
                            <span className="text-fg-soft">{e.weightSlow.toFixed(1)}</span>{' '}
                            <span className={cn(getChangeColorClass(e.sentimentSlow || undefined))}>
                                {e.sentimentSlow >= 0 ? '+' : ''}{e.sentimentSlow.toFixed(2)}
                            </span>
                        </span>
                    </Link>
                ))}
            </div>
        )}
    </div>
);

// Slow-layer leaderboard per entity type. The cyan dot marks an active thesis.
const NarrativeLeaderboard = ({entities}: {entities: Record<BrainEntityType, BrainEntitySummary[]>}) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TypeColumn title="Themes" entities={entities.theme} />
        <TypeColumn title="Sectors" entities={entities.sector} />
        <TypeColumn title="Tickers" entities={entities.ticker} />
    </div>
);

export default NarrativeLeaderboard;
