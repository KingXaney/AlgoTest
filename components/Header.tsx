import Link from "next/link";
import NavItems from "@/components/NavItems";
import UserDropdown from "@/components/UserDropdown";

type HeaderProps = {
    user: User;
    initialStocks: StockWithWatchlistStatus[];
    initialTopics: TopicLink[];
};

function Header({user, initialStocks, initialTopics}: HeaderProps) {
    return (
        <header className='header'>
            <div className='header-wrapper'>
                {/* Brand */}
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-brand-strong"
                              style={{ fontVariationSettings: "'FILL' 1" }}>
                            terminal
                        </span>
                        <span className="text-xl font-semibold tracking-tighter text-brand"
                              style={{ fontFamily: 'var(--type-display)' }}>
                            AeroTrade
                        </span>
                    </Link>
                    <nav className="hidden sm:block">
                        <NavItems initialStocks={initialStocks} initialTopics={initialTopics}/>
                    </nav>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-3">
                    <UserDropdown user={user} initialStocks={initialStocks} initialTopics={initialTopics}/>
                </div>
            </div>
        </header>
    )
}

export default Header
