'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth.actions";
import PortfolioSidebarCard, { type SidebarPortfolio } from "@/components/PortfolioSidebarCard";
import TopicsSidebarCard, { type SidebarTopics } from "@/components/topics/TopicsSidebarCard";

// Topics lead; the market pages follow. Same order as NAV_ITEMS in lib/constants.ts,
// plus the rows the header doesn't have room for.
const sidebarNavItems = [
    { href: '/topics', label: 'Topics', icon: 'interests' },
    { href: '/', label: 'Dashboard', icon: 'space_dashboard' },
    { href: '/brain', label: 'Brain', icon: 'neurology' },
    { href: '/portfolio', label: 'Portfolio', icon: 'account_balance_wallet' },
    { href: '/trade', label: 'Trade', icon: 'candlestick_chart' },
    { href: '/markets', label: 'Markets', icon: 'query_stats' },
    { href: '/watchlist', label: 'Watchlist', icon: 'bookmark' },
    { href: '/friends', label: 'Friends', icon: 'group' },
    { href: '/history', label: 'History', icon: 'history' },
    { href: '/settings', label: 'Settings', icon: 'settings' },
];

type SidebarProps = {
    watchlistCount: number;
    portfolio: SidebarPortfolio | null;
    topics: SidebarTopics;
};

function Sidebar({ watchlistCount, portfolio, topics }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push('/sign-in');
    };

    // The watchlist count used to be its own card; it now rides on the nav row.
    const badgeFor = (href: string): number => (href === '/watchlist' ? watchlistCount : 0);

    return (
        <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 z-40 flex-col w-64 border-r border-outline-variant/20"
               style={{
                   backgroundColor: 'color-mix(in srgb, var(--surface-2) 90%, transparent)',
                   backdropFilter: 'blur(16px)',
                   WebkitBackdropFilter: 'blur(16px)',
               }}
        >
            <div className="p-6 flex-1 overflow-y-auto">
                <TopicsSidebarCard topics={topics} />

                {portfolio && <PortfolioSidebarCard portfolio={portfolio} />}

                <nav className="space-y-1">
                    {sidebarNavItems.map((item) => {
                        const isActive = item.href === '/'
                            ? pathname === '/'
                            : pathname.startsWith(item.href);
                        const badge = badgeFor(item.href);
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-4 px-4 py-3 transition-all text-xs font-bold tracking-[0.1em] uppercase",
                                    isActive
                                        ? "text-brand border-l-4 border-brand"
                                        : "text-fg-soft hover:text-fg hover:bg-surface-3"
                                )}
                                style={{ fontFamily: 'var(--type-mono)' }}
                            >
                                <span
                                    className="material-symbols-outlined"
                                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                                >{item.icon}</span>
                                <span>{item.label}</span>
                                {badge > 0 && (
                                    <span
                                        className="ml-auto rounded-full bg-surface-3 px-1.5 py-0.5 text-[10px] text-fg-muted"
                                        aria-label={`${badge} ${badge === 1 ? 'symbol' : 'symbols'} on watchlist`}
                                    >{badge}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-4 border-t border-line-strong/15">
                <Link
                    href="/trade"
                    className="w-full py-3 rounded-lg mb-4 flex justify-center items-center gap-2 text-xs font-bold tracking-[0.1em] uppercase transition-all active:scale-[0.98] animate-glow"
                    style={{
                        fontFamily: 'var(--type-mono)',
                        backgroundColor: 'var(--brand)',
                        color: 'var(--on-brand)',
                        boxShadow: '0 0 15px color-mix(in srgb, var(--brand) 30%, transparent)',
                    }}
                >
                    <span className="material-symbols-outlined text-base">candlestick_chart</span>
                    Trade Now
                </Link>
                <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-4 px-4 py-2 text-fg-soft hover:text-negative transition-colors text-xs font-bold tracking-[0.1em] uppercase"
                    style={{ fontFamily: 'var(--type-mono)' }}
                >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
