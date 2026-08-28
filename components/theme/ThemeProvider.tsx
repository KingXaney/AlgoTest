'use client';

import {createContext, useCallback, useContext, useMemo, useRef, useState, useTransition, type ReactNode} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {PALETTES, type PaletteMode} from "@/lib/theme/palettes";
import {modeOfTheme, themeEquals, type Theme} from "@/lib/theme/resolve";
import {setAppearance} from "@/lib/actions/appearance.actions";

export type ThemeTokens = {
    mode: PaletteMode;
    surface0: string;
    brand: string;
    positive: string;
    negative: string;
    fgMuted: string;
    reduceMotion: boolean;
};

type ThemeContextValue = {
    theme: Theme;              // the committed theme (what the server rendered)
    mode: PaletteMode;
    tokens: ThemeTokens;
    pending: boolean;
    preview: (theme: Theme) => void;
    commit: (theme: Theme) => void;
    cancel: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Attributes live on <html> so portals (dialogs, dropdowns, chat, toasts) inherit them.
const applyToDocument = (theme: Theme) => {
    const el = document.documentElement;
    const mode = modeOfTheme(theme);
    el.dataset.palette = theme.palette;
    el.dataset.style = theme.style;
    el.dataset.mode = mode;
    el.dataset.motion = theme.reduceMotion ? 'reduced' : 'auto';
    el.classList.toggle('dark', mode === 'dark');
    el.style.colorScheme = mode;
};

const tokensFor = (theme: Theme): ThemeTokens => {
    const t = PALETTES[theme.palette].tokens;
    return {
        mode: modeOfTheme(theme),
        surface0: t.surface0,
        brand: t.brand,
        positive: t.positive,
        negative: t.negative,
        fgMuted: t.fgMuted,
        reduceMotion: theme.reduceMotion,
    };
};

const ThemeProvider = ({initial, children}: {initial: Theme; children: ReactNode}) => {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [committed, setCommitted] = useState(initial);
    // A cookie change re-renders the layouts with a new `initial`; adopt it without an effect.
    const [seenInitial, setSeenInitial] = useState(initial);
    if (!themeEquals(seenInitial, initial)) {
        setSeenInitial(initial);
        setCommitted(initial);
    }

    // The theme a commit is saving; hover-out (cancel) must fall back to it, not to
    // the previous committed theme, or the page flashes back until the save resolves.
    const pendingTheme = useRef<Theme | null>(null);

    const preview = useCallback((theme: Theme) => {
        if (pendingTheme.current) return;   // a commit is in flight; don't paint a third theme
        applyToDocument(theme);
    }, []);
    const cancel = useCallback(() => applyToDocument(pendingTheme.current ?? committed), [committed]);

    const commit = useCallback((theme: Theme) => {
        pendingTheme.current = theme;
        applyToDocument(theme);
        startTransition(async () => {
            const result = await setAppearance(theme);
            if (pendingTheme.current === theme) pendingTheme.current = null;
            if (result.success) {
                const saved = result.theme ?? theme;
                setCommitted(saved);
                applyToDocument(saved);
                // The cookie write already re-renders the layouts; refresh is cheap insurance.
                router.refresh();
            } else {
                applyToDocument(pendingTheme.current ?? committed);
                toast.error(result.message ?? 'Could not save your theme');
            }
        });
    }, [committed, router]);

    const value = useMemo<ThemeContextValue>(() => ({
        theme: committed,
        mode: modeOfTheme(committed),
        tokens: tokensFor(committed),
        pending,
        preview,
        commit,
        cancel,
    }), [committed, pending, preview, commit, cancel]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextValue => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
    return ctx;
};

// Colours for canvas/SVG/embeds that cannot read CSS variables. Tracks the
// committed theme only, so previews never re-embed TradingView widgets.
export const useThemeTokens = (): ThemeTokens => useTheme().tokens;

export default ThemeProvider;
