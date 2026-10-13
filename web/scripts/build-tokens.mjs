// Builds styles/tokens.css from design/tokens.json (the design system's single source of values).
// Run by `npm run dev`, `npm run build` and `npm test`; the output is not committed.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokensPath = join(root, 'design', 'tokens.json');
const outPath = join(root, 'styles', 'tokens.css');

export function buildTokensCss(tokens, { fontsDir } = {}) {
  const names = new Set();
  const vars = [];
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
    }
  }
  for (const key of ['spacing', 'radius', 'shadow', 'size']) {
    for (const t of tokens[key].tokens) add(t.name, t.value);
  }

  // "{action}" in tokens.json means "the value of the action token".
  const resolved = vars.map(([name, value]) => {
    const out = value.replace(/\{([a-z0-9-]+)\}/g, (_, ref) => {
      if (!names.has(ref)) throw new Error(`token ${name} refers to unknown token ${ref}`);
      return `var(--${ref})`;
    });
    return `  --${name}: ${out};`;
  });

  const faces = tokens.type.fonts.map((f) => {
    const file = f.file.split('/').pop();
    if (fontsDir && !existsSync(join(fontsDir, file))) throw new Error(`font file missing: public/fonts/${file}`);
    return `@font-face { font-family: "${f.family}"; src: url("/fonts/${file}") format("woff2"); font-weight: ${f.weight}; font-style: ${f.style}; font-display: swap; }`;
  });

  return [
    '/* Generated from design/tokens.json by scripts/build-tokens.mjs. Do not edit by hand. */',
    ...faces,
    '',
    ':root {',
    ...resolved,
    '}',
    '',
  ].join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tokens = JSON.parse(readFileSync(tokensPath, 'utf8'));
  const css = buildTokensCss(tokens, { fontsDir: join(root, 'public', 'fonts') });
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, css);
  console.log(`tokens.css: ${css.split('\n').filter((l) => l.startsWith('  --')).length} variables, ${tokens.type.fonts.length} fonts`);
}
