// A preset is just a pointer into the two registries; the invariant that matters is
// that every pointer is valid and that "default" means exactly DEFAULT_THEME.

import {describe, expect, it} from 'vitest';

import {PALETTES} from '@/lib/theme/palettes';
import {PRESETS, findPreset} from '@/lib/theme/presets';
import {DEFAULT_THEME, isPaletteId} from '@/lib/theme/resolve';
import {STYLE_IDS, isStyleId} from '@/lib/theme/styles';

describe('PRESETS', () => {
    it('has twelve entries with unique ids', () => {
        expect(PRESETS).toHaveLength(12);
        expect(new Set(PRESETS.map((preset) => preset.id)).size).toBe(12);
    });

    it('only references registered palette and style ids', () => {
        for (const preset of PRESETS) {
            expect(isPaletteId(preset.palette), preset.id).toBe(true);
            expect(isStyleId(preset.style), preset.id).toBe(true);
        }
    });

    it('never repeats a palette × style pairing', () => {
        const pairs = PRESETS.map((preset) => `${preset.palette}/${preset.style}`);
        expect(new Set(pairs).size).toBe(pairs.length);
    });

    it('has a label and description on every card', () => {
        for (const preset of PRESETS) {
            expect(preset.label.trim().length, preset.id).toBeGreaterThan(0);
            expect(preset.description.trim().length, preset.id).toBeGreaterThan(0);
            expect(preset.id).toMatch(/^[a-z][a-z0-9-]*$/);
        }
    });

    it('marks exactly one preset as default and it is DEFAULT_THEME', () => {
        const defaults = PRESETS.filter((preset) => preset.isDefault === true);
        expect(defaults).toHaveLength(1);
        expect(defaults[0].id).toBe('quiet-cyber');
        expect(defaults[0].palette).toBe(DEFAULT_THEME.palette);
        expect(defaults[0].style).toBe(DEFAULT_THEME.style);
    });

    it('showcases every style at least once', () => {
        const used = new Set(PRESETS.map((preset) => preset.style));
        for (const style of STYLE_IDS) {
            expect(used.has(style), style).toBe(true);
        }
    });

    it('includes both light palettes so light mode is one click away', () => {
        const lightPalettes = PRESETS.map((preset) => preset.palette).filter((id) => PALETTES[id].mode === 'light');
        expect(new Set(lightPalettes)).toEqual(new Set(['paper', 'arctic']));
    });

    it('pins the agreed palette × style combinations', () => {
        const byId = Object.fromEntries(PRESETS.map((preset) => [preset.id, `${preset.palette}+${preset.style}`]));
        expect(byId).toEqual({
            'quiet-cyber': 'quiet-cyber+minimal',
            'neon-terminal': 'quiet-cyber+futuristic',
            'liquid-cyber': 'quiet-cyber+liquid-glass',
            'dracula-glass': 'dracula+liquid-glass',
            'nordic-frost': 'nord+soft',
            paper: 'paper+minimal',
            'arctic-glass': 'arctic+liquid-glass',
            'gruvbox-brutal': 'gruvbox-dark+brutalist',
            'tokyo-neon': 'tokyo-night+futuristic',
            'mocha-soft': 'catppuccin-mocha+soft',
            'rose-glass': 'rose-pine+liquid-glass',
            'solarized-terminal': 'solarized-dark+minimal',
        });
    });
});

describe('findPreset', () => {
    it('resolves the default theme to the default card', () => {
        expect(findPreset(DEFAULT_THEME.palette, DEFAULT_THEME.style)?.id).toBe('quiet-cyber');
    });

    it('finds every preset from its own pairing', () => {
        for (const preset of PRESETS) {
            expect(findPreset(preset.palette, preset.style)).toBe(preset);
        }
    });

    it('returns undefined for a pairing that has no card', () => {
        expect(findPreset('monokai', 'brutalist')).toBeUndefined();
        expect(findPreset('quiet-cyber', 'soft')).toBeUndefined();
    });
});
