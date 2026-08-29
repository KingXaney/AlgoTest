import Link from "next/link";
import {auth} from "@/lib/better-auth/auth";
import {headers} from "next/headers";
import {redirect} from "next/navigation";

const Layout = async ({children}:{children : React.ReactNode}) => {

    const session = await auth.api.getSession({headers: await headers()});
    if(session?.user) redirect('/topics')
    return (
        <main className="auth-layout">
            <section className="auth-left-section scrollbar-hide-default">
                <Link href="/" className="auth-logo flex items-center gap-2">
                    <span className="material-symbols-outlined text-brand-strong"
                          style={{ fontVariationSettings: "'FILL' 1" }}>
                        terminal
                    </span>
                    <span className="text-xl font-semibold tracking-tighter text-brand"
                          style={{ fontFamily: 'var(--type-display)' }}>
                        AeroTrade
                    </span>
                </Link>

                <div className="pb-6 lg:pb-8 flex-1">{children}</div>
            </section>

            <section className="auth-right-section">
                <div className="z-10 relative lg:mt-4 lg:mb-16">
                    <blockquote className="auth-blockquote">
                        AeroTrade turned my watchlist into a winning list. The real-time telemetry is unparalleled, and the precision alerts give me an edge in every trade.
                    </blockquote>
                    <div className="flex items-center justify-between">
                        <div>
                            <cite className="auth-testimonial-author">— XINNAN HUANG</cite>
                            <p className="max-md:text-xs text-fg-muted"
                               style={{ fontFamily: 'var(--type-mono)', letterSpacing: '0.02em' }}>
                                Verified Node 072 · Pro Trader
                            </p>
                        </div>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} className="material-symbols-outlined text-brand-strong text-lg"
                                      style={{ fontVariationSettings: "'FILL' 1" }}>
                                    star
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="flex-1 relative">
                    <div className="absolute top-0 left-0 w-full h-full opacity-20"
                         style={{
                             background: 'radial-gradient(circle at 30% 50%, color-mix(in srgb, var(--brand-strong) 15%, transparent), transparent 70%)',
                         }}>
                    </div>
                    <div className="absolute top-8 left-8 right-8 bottom-8 rounded-2xl overflow-hidden"
                         style={{
                             background: 'linear-gradient(135deg, color-mix(in srgb, var(--brand-strong) 5%, transparent), color-mix(in srgb, var(--secondary-tint) 5%, transparent))',
                             border: '1px solid color-mix(in srgb, var(--brand) 10%, transparent)',
                             backdropFilter: 'blur(8px)',
                         }}>
                        {/* Terminal-like decorative content */}
                        <div className="p-6 space-y-3 opacity-40">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-3 h-3 rounded-full bg-negative"></div>
                                <div className="w-3 h-3 rounded-full bg-brand-strong"></div>
                                <div className="w-3 h-3 rounded-full bg-brand"></div>
                            </div>
                            <p style={{ fontFamily: 'var(--type-mono)', fontSize: '11px', color: 'var(--brand)' }}>
                                &gt; SYSTEM.INIT: AeroTrade Terminal v2.44
                            </p>
                            <p style={{ fontFamily: 'var(--type-mono)', fontSize: '11px', color: 'var(--fg-muted)' }}>
                                &gt; Connecting to market nodes...
                            </p>
                            <p style={{ fontFamily: 'var(--type-mono)', fontSize: '11px', color: 'var(--brand-dim)' }}>
                                &gt; 47 nodes online · Latency: 0.8ms
                            </p>
                            <p style={{ fontFamily: 'var(--type-mono)', fontSize: '11px', color: 'var(--fg-muted)' }}>
                                &gt; Portfolio sync: COMPLETE
                            </p>
                            <p style={{ fontFamily: 'var(--type-mono)', fontSize: '11px', color: 'var(--brand)' }}>
                                &gt; AI Assistant: READY
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}

export default Layout
