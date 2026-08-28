import {cn, formatPrice, getChangeColorClass} from "@/lib/utils";

const formatWhen = (ms: number) =>
    new Date(ms).toLocaleString('en-US', {month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'});

const TradeHistory = ({trades}: {trades: PaperTradeRecord[]}) => {
    if (trades.length === 0) {
        return <p className="text-sm text-fg-muted p-4">No trades yet. Place your first order to get started.</p>;
    }

    return (
        <div className="space-y-1.5">
            {trades.map((t) => {
                const isBuy = t.side === 'buy';
                return (
                    <div key={t.id}
                         className="flex items-center justify-between px-4 py-2.5 rounded-lg border bg-surface-2/40 border-line-strong/20">
                        <div className="flex items-center gap-3">
                            <span className={cn(
                                'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border',
                                isBuy
                                    ? 'bg-brand/10 text-brand border-brand/20'
                                    : 'bg-negative/10 text-negative border-negative/20',
                            )} style={{fontFamily: 'var(--type-mono)'}}>
                                {t.side}
                            </span>
                            <div>
                                <span className="text-sm font-bold text-fg" style={{fontFamily: 'var(--type-mono)'}}>{t.symbol}</span>
                                <span className="text-xs text-fg-muted ml-2">{t.quantity} @ {formatPrice(t.price)}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-fg" style={{fontFamily: 'var(--type-mono)'}}>{formatPrice(t.total)}</div>
                            <div className="text-[10px] text-fg-muted">
                                {formatWhen(t.createdAt)}
                                {typeof t.realizedPnl === 'number' && (
                                    <span className={cn('ml-2', getChangeColorClass(t.realizedPnl || undefined))}>
                                        {t.realizedPnl >= 0 ? '+' : ''}{formatPrice(t.realizedPnl)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default TradeHistory;
