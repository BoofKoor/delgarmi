// The CSS variables of design/tokens.json (the design system's single source of values), in the two
// layers the design-system page itself uses:
// - styles/tokens.css: what the page also generates from tokens.json (colours, font families, the
//   token lists, the fonts). Run by `npm run dev`, `npm run build` and `npm test`; not committed.
// - the generated block at the top of design/components.css (the system's bundle.css): what the page
//   does not generate, so its previews and the site get it from the bundle: the type styles as
//   variables, the phone values and reduced motion. `node scripts/build-tokens.mjs --bundle` rewrites
//   it after tokens.json changes; a unit test fails while it is stale.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tokensPath = join(root, 'design', 'tokens.json');
const outPath = join(root, 'styles', 'tokens.css');
const bundlePath = join(root, 'design', 'components.css');

/** Token families that are plain `{ tokens: [{ name, value, valueMobile? }] }` lists, in output order. */
export const FAMILIES = ['spacing', 'radius', 'shadow', 'size', 'duration', 'easing', 'zIndex', 'breakpoint'];

export const BLOCK_START = '/* ---------- tokens: generated from tokens.json by web/scripts/build-tokens.mjs --bundle; do not edit by hand ---------- */';
export const BLOCK_END = '/* ---------- tokens: end of the generated block ---------- */';

/** Below bp-md the phone values apply (`fontSizeMobile` of a type style, `valueMobile` of a token). */
export function phoneQuery(tokens) {
  const bp = tokens.breakpoint?.tokens.find((t) => t.name === 'bp-md')?.value;
  if (!/^\d+px$/.test(bp ?? '')) throw new Error('breakpoint bp-md must be a px value');
  return `(max-width: ${Number.parseInt(bp, 10) - 0.02}px)`;
}

/** Every name tokens.json declares (styles/tokens.css and the bundle block together), for checking references. */
function declaredNames(tokens) {
  const names = new Set();
  const add = (name) => {
    if (!/^[a-z0-9-]+$/.test(name)) throw new Error(`bad token name: ${name}`);
    if (names.has(name)) throw new Error(`duplicate token: ${name}`);
    names.add(name);
  };
  for (const t of tokens.color.tokens) add(t.name);
  add('font-text');
  add('font-display');
  for (const group of tokens.type.groups) {
    for (const s of group.styles) for (const part of ['family', 'size', 'line', 'weight']) add(`type-${s.name}-${part}`);
  }
  for (const key of FAMILIES) for (const t of tokens[key]?.tokens ?? []) add(t.name);
  return names;
}

/** "{action}" in tokens.json means "the value of the action token". */
function lineFor(names) {
  return ([name, value]) => {
    const out = String(value).replace(/\{([a-z0-9-]+)\}/g, (_, ref) => {
      if (!names.has(ref)) throw new Error(`token ${name} refers to unknown token ${ref}`);
      return `var(--${ref})`;
    });
    return `  --${name}: ${out};`;
  };
}

export function buildTokensCss(tokens, { fontsDir } = {}) {
  const line = lineFor(declaredNames(tokens));
  const vars = [];
  for (const t of tokens.color.tokens) vars.push([t.name, t.value]);
  vars.push(['font-text', tokens.type.families.text], ['font-display', tokens.type.families.display]);
  for (const key of FAMILIES) for (const t of tokens[key]?.tokens ?? []) vars.push([t.name, t.value]);

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
    ...vars.map(line),
    '}',
    '',
  ].join('\n');
}

/** The block at the top of the bundle: type styles as variables, phone values, reduced motion. */
export function bundleBlock(tokens) {
  const line = lineFor(declaredNames(tokens));
  const vars = [];
  const phone = [];
  for (const group of tokens.type.groups) {
    for (const s of group.styles) {
      vars.push([`type-${s.name}-family`, `{font-${group.family}}`]);
      vars.push([`type-${s.name}-size`, s.fontSize]);
      vars.push([`type-${s.name}-line`, s.lineHeight]);
      vars.push([`type-${s.name}-weight`, s.fontWeight]);
      if (s.fontSizeMobile) phone.push([`type-${s.name}-size`, s.fontSizeMobile]);
    }
  }
  for (const key of FAMILIES) for (const t of tokens[key]?.tokens ?? []) if (t.valueMobile) phone.push([t.name, t.valueMobile]);
  const durations = (tokens.duration?.tokens ?? []).map((t) => `    --${t.name}: 0ms;`);

  return [
    BLOCK_START,
    ':root {',
    ...vars.map(line),
    '}',
    `@media ${phoneQuery(tokens)} {`,
    '  :root {',
    ...phone.map((p) => `  ${line(p)}`),
    '  }',
    '}',
    '@media (prefers-reduced-motion: reduce) {',
    '  :root {',
    ...durations,
    '  }',
    '}',
    BLOCK_END,
  ].join('\n');
}

/** The bundle with its generated block replaced by `block`. */
export function withBundleBlock(bundle, block) {
  const start = bundle.indexOf(BLOCK_START);
  const end = bundle.indexOf(BLOCK_END);
  if (start < 0 || end < start) throw new Error('design/components.css has no generated tokens block');
  return bundle.slice(0, start) + block + bundle.slice(end + BLOCK_END.length);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tokens = JSON.parse(readFileSync(tokensPath, 'utf8'));
  const css = buildTokensCss(tokens, { fontsDir: join(root, 'public', 'fonts') });
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, css);
  const count = css.split('\n').filter((l) => /^ {2}--/.test(l)).length;
  console.log(`tokens.css: ${count} variables, ${tokens.type.fonts.length} fonts`);
  if (process.argv.includes('--bundle')) {
    writeFileSync(bundlePath, withBundleBlock(readFileSync(bundlePath, 'utf8'), bundleBlock(tokens)));
    console.log('design/components.css: generated block rewritten; copy the file to the design system (bundle.css)');
  }
}
