// The only path from untrusted input (cookie, database document, action payload)
// to the <html> attributes and the palette stylesheet. Every field is whitelisted
// against the registries and nothing here throws, so a tampered cookie or a stale
// preference document degrades to the default theme rather than to an error page
// or an injected selector.

import {PALETTE_IDS, modeOf, type PaletteId, type PaletteMode} from '@/lib/theme/palettes';
import {isStyleId, type StyleId} from '@/lib/theme/styles';

export type Theme = {
    palette: PaletteId;
    style: StyleId;
    reduceMotion: boolean;
};

export const DEFAULT_THEME: Theme = {palette: 'quiet-cyber', style: 'minimal', reduceMotion: false};

export const THEME_COOKIE = 'aero-theme';

export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

// Bumping this invalidates every stored cookie at once, which is the intended way
// to retire a palette or style id.
const COOKIE_VERSION = 'v1';

export function isPaletteId(value: unknown): value is PaletteId {
    return typeof value === 'string' && (PALETTE_IDS as readonly string[]).includes(value);
}

// Per-field: a document with one bad field keeps its other choices. Only a literal
// boolean true counts for reduceMotion so 'true', 1 and {} cannot sneak through.
export function resolveTheme(input: unknown): Theme {
    if (typeof input !== 'object' || input === null) {
        return {...DEFAULT_THEME};
    }
    const raw = input as Record<string, unknown>;
    return {
        palette: isPaletteId(raw.palette) ? raw.palette : DEFAULT_THEME.palette,
        style: isStyleId(raw.style) ? raw.style : DEFAULT_THEME.style,
        reduceMotion: raw.reduceMotion === true,
    };
}

export function encodeThemeCookie(theme: Theme): string {
    // Re-resolve so a caller that cast an unchecked object cannot write junk.
    const safe = resolveTheme(theme);
    return `${COOKIE_VERSION}:${safe.palette}:${safe.style}:${safe.reduceMotion ? '1' : '0'}`;
}

// Whole-value: a cookie is either exactly what encodeThemeCookie wrote or it is
// ignored. Partial recovery would let a malformed cookie pin a half-applied theme.
export function decodeThemeCookie(value?: string | null): Theme {
    if (typeof value !== 'string') {
        return {...DEFAULT_THEME};
    }
    const parts = value.split(':');
    if (parts.length !== 4 || parts[0] !== COOKIE_VERSION) {
        return {...DEFAULT_THEME};
    }
    const [, palette, style, motion] = parts;
    if (!isPaletteId(palette) || !isStyleId(style) || (motion !== '0' && motion !== '1')) {
        return {...DEFAULT_THEME};
    }
    return {palette, style, reduceMotion: motion === '1'};
}

export function themeEquals(a: Theme, b: Theme): boolean {
    return a.palette === b.palette && a.style === b.style && a.reduceMotion === b.reduceMotion;
}

export function modeOfTheme(theme: Theme): PaletteMode {
    return modeOf(theme.palette);
}
