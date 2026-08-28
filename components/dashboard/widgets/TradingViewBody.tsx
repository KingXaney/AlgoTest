'use client';

import TradingViewWidget from "@/components/TradingViewWidget";
import {
    CRYPTO_SCREENER_WIDGET_CONFIG,
    FOREX_CROSS_RATES_WIDGET_CONFIG,
    HEATMAP_WIDGET_CONFIG,
    MARKET_SCREENER_WIDGET_CONFIG,
    TICKER_TAPE_WIDGET_CONFIG,
    TOP_STORIES_WIDGET_CONFIG,
    TV_SCRIPT_BASE,
} from "@/lib/constants";

export type TradingViewKind = 'tv-heatmap' | 'tv-top-stories' | 'tv-ticker-tape' | 'tv-market-screener' | 'tv-crypto-screener' | 'tv-forex';

// Module-level configs keep a stable identity, so the embed only re-inits on a theme change.
const EMBEDS: Record<TradingViewKind, {script: string; config: Record<string, unknown>; height: number; title?: string; className?: string}> = {
    'tv-heatmap': {script: 'stock-heatmap.js', config: HEATMAP_WIDGET_CONFIG, height: 460, title: 'Market Heatmap'},
    'tv-top-stories': {script: 'timeline.js', config: TOP_STORIES_WIDGET_CONFIG, height: 460, title: 'Top Stories', className: 'custom-chart'},
    'tv-ticker-tape': {script: 'ticker-tape.js', config: TICKER_TAPE_WIDGET_CONFIG, height: 70},
    'tv-market-screener': {script: 'screener.js', config: MARKET_SCREENER_WIDGET_CONFIG, height: 600, title: 'Stock Screener'},
    'tv-crypto-screener': {script: 'screener.js', config: CRYPTO_SCREENER_WIDGET_CONFIG, height: 540, title: 'Crypto Screener'},
    'tv-forex': {script: 'forex-cross-rates.js', config: FOREX_CROSS_RATES_WIDGET_CONFIG, height: 540, title: 'Forex Cross Rates'},
};

const TradingViewBody = ({kind}: {kind: TradingViewKind}) => {
    const embed = EMBEDS[kind];
    return (
        <TradingViewWidget
            title={embed.title}
            scriptUrl={`${TV_SCRIPT_BASE}${embed.script}`}
            config={embed.config}
            height={embed.height}
            className={embed.className}
        />
    );
};

export default TradingViewBody;
