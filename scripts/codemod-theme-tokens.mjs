#!/usr/bin/env node
// One-shot migration of hard-coded colours/fonts to the semantic theme tokens
// defined in app/globals.css. Idempotent: running it twice is a no-op.
//
//   node scripts/codemod-theme-tokens.mjs --self-test      # verify the rewrite rules
//   node scripts/codemod-theme-tokens.mjs --dry-run         # report, write nothing
//   node scripts/codemod-theme-tokens.mjs                   # rewrite in place
//
// Scope: app/**/*.tsx, components/**/*.tsx, lib/utils.ts, app/globals.css.
// Hand-treated files (SVG/canvas colour logic) are excluded on purpose.

import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const ROOT = process.cwd();
const argv = process.argv.slice(2);
const DRY = argv.includes('--dry-run');
const SELF_TEST = argv.includes('--self-test');

const ROOTS = ['app', 'components', 'lib/utils.ts'];
const EXCLUDE = [
    'components/brain/BrainGraph.tsx',
    'components/analytics/PerformanceChart.tsx',
    'components/ParticleBackground.tsx',
];

// Base colour -> semantic token. Every literal not listed here is reported, never guessed.
const HEX_TO_TOKEN = {
    e2e2e8: 'fg', b9cacb: 'fg-soft', '849495': 'fg-muted',
    '7df4ff': 'brand', '00f0ff': 'brand-strong', '00dbe9': 'brand-dim',
    '002022': 'on-brand', '04212a': 'on-brand', '006970': 'on-brand',
    ffb4ab: 'negative', '690005': 'on-negative',
    '050608': 'bg', '0d1014': 'chrome', '0c0e12': 'chrome',
    '111318': 'surface-0', '14171b': 'surface-1', '1a1c20': 'surface-2', '1e2024': 'surface-2',
    '282a2e': 'surface-3', '333539': 'surface-4', '37393e': 'surface-4', '3b494b': 'line-strong',
    '7000ff': 'secondary-tint',
};
// Literals that keep a literal value but are still themed (derived from a token).
const HEX_TO_CUSTOM = {
    ff9a8e: 'color-mix(in srgb, var(--negative) 88%, white)',
};
const RGB_TO_TOKEN = {
    '125,244,255': 'brand', '0,240,255': 'brand-strong', '59,73,75': 'line-strong',
    '30,32,36': 'surface-2', '40,42,46': 'surface-3', '17,19,24': 'surface-0',
    '12,14,18': 'chrome', '26,28,32': 'surface-2', '255,180,171': 'negative',
    '147,0,10': 'negative', '112,0,255': 'secondary-tint',
};
// Medal colours are semantic on their own and must not follow the palette.
const KEEP_HEX = new Set(['ffd700', 'c0c8d0', 'cd7f32']);
const KEEP_RGB = new Set(['255,215,0']);
const FONT_MAP = {sora: 'display', jetbrains: 'mono', hanken: 'body'};

const UTIL = '(?:bg|text|border(?:-[trblxyse])?|ring(?:-offset)?|via|from|to|fill|stroke|outline|divide|placeholder|accent|caret|decoration|shadow)';
const ALPHA = '(0?\\.\\d+|1(?:\\.0+)?|0)';
const CLASS_RE = new RegExp(
    String.raw`((?:[\w\[\]=:.\-/]+:)*)(!?)(${UTIL})-\[(?:#([0-9a-fA-F]{6})|rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*${ALPHA}\s*\))\](\/\d+)?`,
    'g',
);
const HEX_RE = /#([0-9a-fA-F]{6})\b/g;
const RGBA_RE = new RegExp(String.raw`rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*${ALPHA}\s*\)`, 'g');
const FONT_RE = /var\(--font-(sora|jetbrains|hanken)\)/g;

const pct = (a) => Math.round(parseFloat(a) * 100);

// rgba(255,255,255,a) is the hairline at .06; any other white alpha is a foreground tint.
const whiteToken = (a) => (pct(a) === 6 ? {token: 'line'} : {token: 'fg', alpha: pct(a)});

const rgbToken = (r, g, b, a) => {
    const key = `${r},${g},${b}`;
    if (KEEP_RGB.has(key)) return null;
    if (key === '255,255,255') return whiteToken(a);
    const token = RGB_TO_TOKEN[key];
    return token ? {token, alpha: pct(a)} : undefined;
};

export function transform(source, {css = false} = {}) {
    const unmapped = [];
    let text = source;
    let classHits = 0;
    let literalHits = 0;
    let fontHits = 0;

    if (!css) {
        text = text.replace(CLASS_RE, (m, prefix, bang, util, hex, r, g, b, a, existing) => {
            let token;
            let opacity = existing ?? '';
            if (hex) {
                const key = hex.toLowerCase();
                if (KEEP_HEX.has(key)) return m;
                token = HEX_TO_TOKEN[key];
                if (!token) { unmapped.push(m); return m; }
            } else {
                const res = rgbToken(r, g, b, a);
                if (res === null) return m;
                if (!res) { unmapped.push(m); return m; }
                token = res.token;
                if (!existing && res.alpha !== undefined) opacity = `/${res.alpha}`;
            }
            classHits += 1;
            return `${prefix}${bang}${util}-${token}${opacity}`;
        });
    }

    text = text.replace(FONT_RE, (_, f) => { fontHits += 1; return `var(--type-${FONT_MAP[f]})`; });

    text = text.replace(RGBA_RE, (m, r, g, b, a) => {
        const res = rgbToken(r, g, b, a);
        if (res === null) return m;
        if (!res) { unmapped.push(m); return m; }
        literalHits += 1;
        if (res.alpha === undefined) return `var(--${res.token})`;
        return `color-mix(in srgb, var(--${res.token}) ${res.alpha}%, transparent)`;
    });

    text = text.replace(HEX_RE, (m, hex) => {
        const key = hex.toLowerCase();
        if (KEEP_HEX.has(key)) return m;
        if (HEX_TO_CUSTOM[key]) { literalHits += 1; return HEX_TO_CUSTOM[key]; }
        const token = HEX_TO_TOKEN[key];
        if (!token) { unmapped.push(m); return m; }
        literalHits += 1;
        return `var(--${token})`;
    });

    return {text, unmapped, stats: {classHits, literalHits, fontHits}};
}

// Only run the migration when executed directly; importing exposes transform() for tooling.
const isMain = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;

const FIXTURES = [
    ['text-[#849495]', 'text-fg-muted'],
    ['bg-[rgba(30,32,36,0.4)]', 'bg-surface-2/40'],
    ['hover:bg-[#282a2e]/60', 'hover:bg-surface-3/60'],
    ['data-[state=checked]:!bg-[#00f0ff]', 'data-[state=checked]:!bg-brand-strong'],
    ['focus:!bg-[rgba(255,180,171,0.1)] focus:!text-[#ffb4ab]', 'focus:!bg-negative/10 focus:!text-negative'],
    ['ring-[rgba(255,255,255,0.06)]', 'ring-line'],
    ['via-[rgba(125,244,255,0.5)]', 'via-brand/50'],
    ['text-[rgba(125,244,255,0.6)]', 'text-brand/60'],
    ['border-l-4 border-[#7df4ff]', 'border-l-4 border-brand'],
    ['hover:border-[rgba(125,244,255,0.25)]', 'hover:border-brand/25'],
    ["style={{backgroundColor: '#00f0ff', border: '1px solid rgba(59,73,75,0.4)'}}",
        "style={{backgroundColor: 'var(--brand-strong)', border: '1px solid color-mix(in srgb, var(--line-strong) 40%, transparent)'}}"],
    ["fontFamily: 'var(--font-sora)'", "fontFamily: 'var(--type-display)'"],
    ['fontFamily="var(--font-jetbrains)"', 'fontFamily="var(--type-mono)"'],
    ["'linear-gradient(135deg, rgba(0, 240, 255, 0.05), rgba(112, 0, 255, 0.05))'",
        "'linear-gradient(135deg, color-mix(in srgb, var(--brand-strong) 5%, transparent), color-mix(in srgb, var(--secondary-tint) 5%, transparent))'"],
    ['text-[#ffd700] bg-[rgba(255,215,0,0.08)]', 'text-[#ffd700] bg-[rgba(255,215,0,0.08)]'],
    ['variable: "--font-sora"', 'variable: "--font-sora"'],
    ['text-[10px] px-[3px]', 'text-[10px] px-[3px]'],
];

if (isMain && SELF_TEST) {
    let failed = 0;
    for (const [input, expected] of FIXTURES) {
        const {text} = transform(input);
        if (text !== expected) {
            failed += 1;
            console.error(`FAIL\n  in:  ${input}\n  out: ${text}\n  exp: ${expected}`);
        }
    }
    // Idempotency: a second pass must change nothing.
    for (const [, expected] of FIXTURES) {
        const {text} = transform(expected);
        if (text !== expected) { failed += 1; console.error(`NOT IDEMPOTENT: ${expected} -> ${text}`); }
    }
    console.log(failed ? `${failed} fixture(s) failed` : `all ${FIXTURES.length} fixtures pass`);
    process.exit(failed ? 1 : 0);
}

if (!isMain) {
    // imported as a library
} else {
const walk = (p, out) => {
    const abs = path.join(ROOT, p);
    const st = fs.statSync(abs);
    if (st.isFile()) { out.push(p); return; }
    for (const entry of fs.readdirSync(abs)) {
        const rel = path.join(p, entry);
        const s = fs.statSync(path.join(ROOT, rel));
        if (s.isDirectory()) walk(rel, out);
        else if (/\.(tsx|ts|css)$/.test(entry)) out.push(rel);
    }
};

const files = [];
for (const r of ROOTS) walk(r, files);

let totalUnmapped = 0;
const summary = [];
for (const rel of files) {
    if (EXCLUDE.includes(rel)) continue;
    const abs = path.join(ROOT, rel);
    const source = fs.readFileSync(abs, 'utf8');
    const {text, unmapped, stats} = transform(source, {css: rel.endsWith('.css')});
    const changed = text !== source;
    if (!changed && unmapped.length === 0) continue;
    summary.push(`${changed ? (DRY ? 'would edit' : 'edited   ') : 'unchanged'} ${rel}  classes=${stats.classHits} literals=${stats.literalHits} fonts=${stats.fontHits}${unmapped.length ? `  UNMAPPED=${[...new Set(unmapped)].join(' | ')}` : ''}`);
    totalUnmapped += unmapped.length;
    if (changed && !DRY) fs.writeFileSync(abs, text);
}
console.log(summary.join('\n'));
console.log(`\n${summary.length} file(s) touched, ${totalUnmapped} unmapped literal(s)${DRY ? ' (dry run)' : ''}`);
}
