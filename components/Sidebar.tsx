'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth.actions";
import PortfolioSidebarCard, { type SidebarPortfolio } from "@/components/PortfolioSidebarCard";

const sidebarNavItems = [
    { href: '/', label: 'Dashboard', icon: 'space_dashboard' },
    { href: '/markets', label: 'Markets', icon: 'query_stats' },
    { href: '/trade', label: 'Trade', icon: 'candlestick_chart' },
    { href: '/portfolio', label: 'Portfolio', icon: 'account_balance_wallet' },
    { href: '/watchlist', label: 'Watchlist', icon: 'bookmark' },
    { href: '/friends', label: 'Friends', icon: 'group' },
    { href: '/history', label: 'History', icon: 'history' },
    { href: '/settings', label: 'Settings', icon: 'settings' },
];

type SidebarProps = {
    watchlistCount: number;
    portfolio: SidebarPortfolio | null;
};

function Sidebar({ watchlistCount, portfolio }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push('/sign-in');
    };

    return (
        <aside className="hidden lg:flex fixed left-0 top-16 bottom-0 z-40 flex-col w-64 border-r border-outline-variant/20"
               style={{
                   backgroundColor: 'color-mix(in srgb, var(--surface-2) 90%, transparent)',
                   backdropFilter: 'blur(16px)',
                   WebkitBackdropFilter: 'blur(16px)',
               }}
        >
            {/* Watchlist Summary Card */}
            <div className="p-6 flex-1 overflow-y-auto">
                <Link
                    href="/watchlist"
                    className="relative block rounded-xl p-4 mb-6 shimmer overflow-hidden transition-all hover:brightness-110"
                    style={{
                        backgroundColor: 'color-mix(in srgb, var(--brand-strong) 6%, transparent)',
                        border: '1px solid color-mix(in srgb, var(--brand) 15%, transparent)',
                    }}
                >
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-brand"
                                  style={{ fontVariationSettings: "'FILL' 1" }}
                            >bookmark</span>
                            <span className="text-brand text-xs font-bold tracking-[0.1em] uppercase"
                                  style={{ fontFamily: 'var(--type-mono)' }}
                            >Tracked Assets</span>
                        </div>
                        <p className="text-2xl font-semibold text-fg"
                           style={{ fontFamily: 'var(--type-display)' }}
                        >{watchlistCount}</p>
                        <p className="text-sm text-brand-dim"
                           style={{ fontFamily: 'var(--type-mono)' }}
                        >{watchlistCount === 1 ? 'symbol' : 'symbols'} <span className="text-fg-muted text-xs">on watchlist</span></p>
                    </div>
                </Link>

                {/* Portfolio Summary Card */}
                {portfolio && <PortfolioSidebarCard portfolio={portfolio} />}

                {/* Navigation Items */}
                <nav className="space-y-1">
                    {sidebarNavItems.map((item) => {
                        const isActive = item.href === '/'
                            ? pathname === '/'
                            : pathname.startsWith(item.href);
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
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Section */}
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
