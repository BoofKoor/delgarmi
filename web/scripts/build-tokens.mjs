// Builds styles/tokens.css from design/tokens.json (the design system's single source of values).
// Run by `npm run dev`, `npm run build` and `npm test`; the output is not committed.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokensPath = join(root, 'design', 'tokens.json');
const outPath = join(root, 'styles', 'tokens.css');

/** Token families that are plain `{ tokens: [{ name, value, valueMobile? }] }` lists, in output order. */
export const FAMILIES = ['spacing', 'radius', 'shadow', 'size', 'duration', 'easing', 'zIndex', 'breakpoint'];

/** Below bp-md the phone values apply (`fontSizeMobile` of a type style, `valueMobile` of a token). */
export function phoneQuery(tokens) {
  const bp = tokens.breakpoint?.tokens.find((t) => t.name === 'bp-md')?.value;
  if (!/^\d+px$/.test(bp ?? '')) throw new Error('breakpoint bp-md must be a px value');
  return `(max-width: ${Number.parseInt(bp, 10) - 0.02}px)`;
}

export function buildTokensCss(tokens, { fontsDir } = {}) {
  const names = new Set();
  const vars = [];
  const phone = [];
  const add = (name, value) => {
    if (!/^[a-z0-9-]+$/.test(name)) throw new Error(`bad token name: ${name}`);
    if (names.has(name)) throw new Error(`duplicate token: ${name}`);
    names.add(name);
    vars.push([name, String(value)]);
  };

  for (const t of tokens.color.tokens) add(t.name, t.value);
  add('font-text', tokens.type.families.text);
  add('font-display', tokens.type.families.display);
  for (const group of tokens.type.groups) {
    for (const s of group.styles) {
      add(`type-${s.name}-family`, `{font-${group.family}}`);
      add(`type-${s.name}-size`, s.fontSize);
      add(`type-${s.name}-line`, s.lineHeight);
      add(`type-${s.name}-weight`, s.fontWeight);
      if (s.fontSizeMobile) phone.push([`type-${s.name}-size`, s.fontSizeMobile]);
    }
  }
  for (const key of FAMILIES) {
    for (const t of tokens[key]?.tokens ?? []) {
      add(t.name, t.value);
      if (t.valueMobile) phone.push([t.name, t.valueMobile]);
    }
  }

  // "{action}" in tokens.json means "the value of the action token".
  const line = ([name, value]) => {
    const out = value.replace(/\{([a-z0-9-]+)\}/g, (_, ref) => {
      if (!names.has(ref)) throw new Error(`token ${name} refers to unknown token ${ref}`);
      return `var(--${ref})`;
    });
    return `  --${name}: ${out};`;
  };

  const faces = tokens.type.fonts.map((f) => {
    const file = f.file.split('/').pop();
    if (fontsDir && !existsSync(join(fontsDir, file))) throw new Error(`font file missing: public/fonts/${file}`);
    return `@font-face { font-family: "${f.family}"; src: url("/fonts/${file}") format("woff2"); font-weight: ${f.weight}; font-style: ${f.style}; font-display: swap; }`;
  });

  const durations = (tokens.duration?.tokens ?? []).map((t) => `  --${t.name}: 0ms;`);

  return [
    '/* Generated from design/tokens.json by scripts/build-tokens.mjs. Do not edit by hand. */',
    ...faces,
    '',
    ':root {',
    ...vars.map(line),
    '}',
    '',
    `@media ${phoneQuery(tokens)} {`,
    '  :root {',
    ...phone.map((p) => `  ${line(p)}`),
    '  }',
    '}',
    '',
    '@media (prefers-reduced-motion: reduce) {',
    '  :root {',
    ...durations.map((d) => `  ${d}`),
    '  }',
    '}',
    '',
  ].join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tokens = JSON.parse(readFileSync(tokensPath, 'utf8'));
  const css = buildTokensCss(tokens, { fontsDir: join(root, 'public', 'fonts') });
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, css);
  const count = css.split('\n').filter((l) => /^ {2}--/.test(l)).length;
  console.log(`tokens.css: ${count} variables, ${tokens.type.fonts.length} fonts`);
}
