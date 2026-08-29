"use client"

import {useEffect, useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {CommandDialog, CommandEmpty, CommandInput, CommandList} from "@/components/ui/command";
import {Button} from "@/components/ui/button";
import {Loader2, Sparkles, TrendingUp} from "lucide-react";
import Link from "next/link";
import {searchStocks} from "@/lib/actions/finnhub.actions";
import {createTopic} from "@/lib/actions/topics.actions";
import {NAME_MAX} from "@/lib/topics/config";
import {useDebounce} from "@/hooks/useDebounce";

// Anything shorter reads as a ticker prefix, not a topic.
const TOPIC_MIN_CHARS = 3;

export default function SearchCommand({
    renderAs = 'button',
    label = 'Add stock',
    initialStocks,
    initialTopics = [],
}: SearchCommandProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [stocks, setStocks] = useState<StockWithWatchlistStatus[]>(initialStocks);
    const [following, startFollow] = useTransition();

    const isSearchMode = !!searchTerm.trim();
    const displayStocks = isSearchMode ? stocks : stocks?.slice(0, 10);

    // "Follow topic" row: any query long enough to be a subject. If it names a
    // topic the user already follows, open that instead of creating a duplicate.
    const topicQuery = searchTerm.trim();
    const canFollow = topicQuery.length >= TOPIC_MIN_CHARS && topicQuery.length <= NAME_MAX;
    const existingTopic = canFollow ? initialTopics.find((t) => t.name.toLowerCase() === topicQuery.toLowerCase()) : undefined;

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setOpen((v) => !v);
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, []);

    const handleSearch = async () => {
        if (!isSearchMode) return setStocks(initialStocks);

        setLoading(true);
        try {
            const results = await searchStocks(searchTerm.trim());
            setStocks(results);
        } catch {
            setStocks([]);
        } finally {
            setLoading(false);
        }
    };

    const debouncedSearch = useDebounce(handleSearch, 300);

    useEffect(() => {
        debouncedSearch();
    }, [searchTerm, debouncedSearch]);

    const handleSelectStock = () => {
        setOpen(false);
        setSearchTerm("");
        setStocks(initialStocks);
    };

    const handleFollowTopic = () => {
        const name = topicQuery;
        startFollow(async () => {
            const result = await createTopic({name});
            if (!result.success || !result.topic) {
                toast.error(result.message ?? 'Could not follow this topic');
                return;
            }
            toast.success(`Following "${result.topic.name}"`);
            handleSelectStock();
            router.push(`/topics/${result.topic.slug}`);
        });
    };

    return (
        <>
            {renderAs === 'text' ? (
                <span onClick={() => setOpen(true)} className="search-text">
                    {label}
                </span>
            ) : (
                <Button onClick={() => setOpen(true)} className="search-btn">
                    {label}
                </Button>
            )}
            <CommandDialog open={open} onOpenChange={setOpen} className="search-dialog">
                <div className="search-field">
                    <CommandInput
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                        placeholder="Search stocks, or type a topic to follow..."
                        className="search-input"
                    />
                    {loading && <Loader2 className="search-loader" />}
                </div>
                <CommandList className="search-list">
                    {canFollow && (
                        <ul>
                            <div className="search-count">Topics</div>
                            <li className="search-item">
                                {existingTopic ? (
                                    <Link href={`/topics/${existingTopic.slug}`} onClick={handleSelectStock} className="search-item-link">
                                        <Sparkles className="h-4 w-4 text-brand" />
                                        <div className="flex-1">
                                            <div className="search-item-name">Open topic: {existingTopic.name}</div>
                                            <div className="text-sm text-fg-muted" style={{fontFamily: 'var(--type-mono)', fontSize: '11px', letterSpacing: '0.02em'}}>
                                                You already follow this
                                            </div>
                                        </div>
                                    </Link>
                                ) : (
                                    <button type="button" onClick={handleFollowTopic} disabled={following} className="search-item-link w-full text-left disabled:opacity-60">
                                        {following ? <Loader2 className="h-4 w-4 animate-spin text-brand" /> : <Sparkles className="h-4 w-4 text-brand" />}
                                        <div className="flex-1">
                                            <div className="search-item-name">Follow topic: “{topicQuery}”</div>
                                            <div className="text-sm text-fg-muted" style={{fontFamily: 'var(--type-mono)', fontSize: '11px', letterSpacing: '0.02em'}}>
                                                News about anything — markets, tech, politics, sport
                                            </div>
                                        </div>
                                    </button>
                                )}
                            </li>
                        </ul>
                    )}
                    {loading ? (
                        <CommandEmpty className="search-list-empty">Loading stocks...</CommandEmpty>
                    ) : displayStocks?.length === 0 ? (
                        <div className="search-list-indicator">
                            {isSearchMode ? 'No stocks found' : 'No stocks available'}
                        </div>
                    ) : (
                        <ul>
                            <div className="search-count">
                                {isSearchMode ? 'Stocks' : 'Popular stocks'}
                                {` `}({displayStocks?.length || 0})
                            </div>
                            {displayStocks?.map((stock) => (
                                <li key={stock.symbol} className="search-item">
                                    <Link
                                        href={`/stocks/${stock.symbol}`}
                                        onClick={handleSelectStock}
                                        className="search-item-link"
                                    >
                                        <TrendingUp className="h-4 w-4 text-brand-dim" />
                                        <div className="flex-1">
                                            <div className="search-item-name">
                                                {stock.name}
                                            </div>
                                            <div className="text-sm text-fg-muted"
                                                 style={{ fontFamily: 'var(--type-mono)', fontSize: '11px', letterSpacing: '0.02em' }}>
                                                {stock.symbol} | {stock.exchange} | {stock.type}
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
}
