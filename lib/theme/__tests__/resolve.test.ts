// resolve.ts is the trust boundary between cookies / stored documents and the
// <html> attributes, so its contract — whitelist everything, never throw — is
// asserted here rather than described in a comment.

import {describe, expect, it} from 'vitest';

import {PALETTE_IDS} from '@/lib/theme/palettes';
import {
    DEFAULT_THEME,
    THEME_COOKIE,
    THEME_COOKIE_MAX_AGE,
    decodeThemeCookie,
    encodeThemeCookie,
    isPaletteId,
    modeOfTheme,
    resolveTheme,
    themeEquals,
    type Theme,
} from '@/lib/theme/resolve';
import {STYLE_IDS} from '@/lib/theme/styles';

const GARBAGE: unknown[] = [undefined, null, 0, 1, true, 'nord', '', [], () => undefined, Symbol('x'), BigInt(12)];

describe('DEFAULT_THEME', () => {
    it('is the first palette with the minimal style and motion enabled', () => {
        expect(DEFAULT_THEME).toEqual({palette: PALETTE_IDS[0], style: 'minimal', reduceMotion: false});
        expect(DEFAULT_THEME.palette).toBe('quiet-cyber');
    });
});

describe('isPaletteId', () => {
    it('accepts every registered id and nothing else', () => {
        for (const id of PALETTE_IDS) {
            expect(isPaletteId(id), id).toBe(true);
        }
        expect(isPaletteId('QUIET-CYBER')).toBe(false);
        expect(isPaletteId('quiet-cyber ')).toBe(false);
        expect(isPaletteId('')).toBe(false);
        expect(isPaletteId(null)).toBe(false);
        expect(isPaletteId({toString: () => 'nord'})).toBe(false);
    });
});

describe('resolveTheme', () => {
    it('returns the default for anything that is not an object', () => {
        for (const input of GARBAGE) {
            expect(resolveTheme(input)).toEqual(DEFAULT_THEME);
        }
    });

    it('returns a fresh object, never the shared default', () => {
        const resolved = resolveTheme(null);
        expect(resolved).not.toBe(DEFAULT_THEME);
        resolved.palette = 'nord';
        expect(DEFAULT_THEME.palette).toBe('quiet-cyber');
    });

    it('accepts a full valid theme unchanged', () => {
        const theme: Theme = {palette: 'rose-pine', style: 'brutalist', reduceMotion: true};
        expect(resolveTheme(theme)).toEqual(theme);
    });

    it('fills missing fields from the default and keeps valid ones', () => {
        expect(resolveTheme({})).toEqual(DEFAULT_THEME);
        expect(resolveTheme({palette: 'nord'})).toEqual({...DEFAULT_THEME, palette: 'nord'});
        expect(resolveTheme({style: 'soft'})).toEqual({...DEFAULT_THEME, style: 'soft'});
        expect(resolveTheme({reduceMotion: true})).toEqual({...DEFAULT_THEME, reduceMotion: true});
    });

    it('replaces unknown ids field by field without touching the others', () => {
        expect(resolveTheme({palette: 'evil', style: 'soft', reduceMotion: true})).toEqual({
            palette: 'quiet-cyber',
            style: 'soft',
            reduceMotion: true,
        });
        expect(resolveTheme({palette: 'nord', style: '"><script>', reduceMotion: true})).toEqual({
            palette: 'nord',
            style: 'minimal',
            reduceMotion: true,
        });
    });

    it('only treats a literal boolean true as reduced motion', () => {
        for (const value of ['true', 1, {}, [], 'yes', null, undefined, 0, false]) {
            expect(resolveTheme({reduceMotion: value}).reduceMotion, String(value)).toBe(false);
        }
        expect(resolveTheme({reduceMotion: true}).reduceMotion).toBe(true);
    });

    it('drops unknown keys and never lifts values out of nested objects', () => {
        const resolved = resolveTheme({palette: 'nord', extra: 'x', nested: {style: 'soft'}, style: {value: 'soft'}});
        expect(Object.keys(resolved).sort()).toEqual(['palette', 'reduceMotion', 'style']);
        expect(resolved.style).toBe('minimal');
        expect('extra' in resolved).toBe(false);
    });

    it('never throws on wrong-typed field values', () => {
        expect(() => resolveTheme({palette: {}, style: [], reduceMotion: () => true})).not.toThrow();
        expect(resolveTheme({palette: {}, style: [], reduceMotion: () => true})).toEqual(DEFAULT_THEME);
    });
});

describe('cookie', () => {
    it('has the agreed name and a one-year max age', () => {
        expect(THEME_COOKIE).toBe('aero-theme');
        expect(THEME_COOKIE_MAX_AGE).toBe(31_536_000);
    });

    it('encodes as v1:<palette>:<style>:<0|1>', () => {
        expect(encodeThemeCookie(DEFAULT_THEME)).toBe('v1:quiet-cyber:minimal:0');
        expect(encodeThemeCookie({palette: 'nord', style: 'soft', reduceMotion: true})).toBe('v1:nord:soft:1');
    });

    it('sanitises an unchecked object before writing it', () => {
        const forged = {palette: 'x:y', style: 'soft', reduceMotion: true} as unknown as Theme;
        expect(encodeThemeCookie(forged)).toBe('v1:quiet-cyber:soft:1');
    });

    it('round-trips every palette × style × motion combination', () => {
        for (const palette of PALETTE_IDS) {
            for (const style of STYLE_IDS) {
                for (const reduceMotion of [false, true]) {
                    const theme: Theme = {palette, style, reduceMotion};
                    expect(decodeThemeCookie(encodeThemeCookie(theme))).toEqual(theme);
                }
            }
        }
    });

    it('falls back to the default for anything it did not write itself', () => {
        const bad = [
            undefined,
            null,
            '',
            'v1',
            'v1:',
            'v1:nord',
            'v1:nord:soft',
            'v1:nord:soft:1:extra',
            'v0:nord:soft:1',
            'v2:nord:soft:1',
            'V1:nord:soft:1',
            'v1:evil:soft:0',
            'v1:nord:evil:0',
            'v1:nord:soft:2',
            'v1:nord:soft:true',
            'v1:nord:soft:',
            'v1:Nord:soft:1',
            'v1: nord:soft:1',
            'v1:nord:soft:1 ',
            '"><script>alert(1)</script>',
            'v1:quiet-cyber"]{}html[data-x="1:minimal:0',
        ];
        for (const value of bad) {
            expect(decodeThemeCookie(value), String(value)).toEqual(DEFAULT_THEME);
        }
    });

    it('returns a fresh object from decode as well', () => {
        expect(decodeThemeCookie(null)).not.toBe(DEFAULT_THEME);
    });
});

describe('themeEquals', () => {
    it('compares all three fields', () => {
        const a: Theme = {palette: 'nord', style: 'soft', reduceMotion: false};
        expect(themeEquals(a, {...a})).toBe(true);
        expect(themeEquals(a, {...a, palette: 'dracula'})).toBe(false);
        expect(themeEquals(a, {...a, style: 'minimal'})).toBe(false);
        expect(themeEquals(a, {...a, reduceMotion: true})).toBe(false);
    });
});

describe('modeOfTheme', () => {
    it('follows the palette', () => {
        expect(modeOfTheme(DEFAULT_THEME)).toBe('dark');
        expect(modeOfTheme({palette: 'paper', style: 'minimal', reduceMotion: false})).toBe('light');
        expect(modeOfTheme({palette: 'arctic', style: 'futuristic', reduceMotion: true})).toBe('light');
    });
});
