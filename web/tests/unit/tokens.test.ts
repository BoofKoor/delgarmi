import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error -- plain ES module without type declarations
import { buildTokensCss, phoneQuery } from '../../scripts/build-tokens.mjs';
import tokens from '@/design/tokens.json';

const root = join(__dirname, '..', '..');
const css: string = buildTokensCss(tokens);

function cssFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === 'node_modules' || name.startsWith('.') ? [] : cssFiles(path);
    return name.endsWith('.css') && name !== 'tokens.css' ? [path] : [];
  });
}

const stylesheets = [...cssFiles(join(root, 'design')), ...cssFiles(join(root, 'styles')), ...cssFiles(join(root, 'app'))];
const read = (file: string) => readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const short = (file: string) => file.slice(root.length + 1);
type Style = { name: string; fontSize: string; fontSizeMobile?: string };
const styles: Style[] = tokens.type.groups.flatMap((g) => g.styles as Style[]);

describe('tokens.css', () => {
  it('defines every variable the stylesheets use', () => {
    const defined = new Set([...css.matchAll(/--([a-z0-9-]+):/g)].map((m) => m[1]));
    expect(stylesheets.length).toBeGreaterThan(2);
    const missing: string[] = [];
    for (const file of stylesheets) {
      const text = read(file);
      const localDefs = new Set([...text.matchAll(/--([a-z0-9-]+):/g)].map((m) => m[1]));
      for (const m of text.matchAll(/var\(--([a-z0-9-]+)/g)) {
        if (!defined.has(m[1]) && !localDefs.has(m[1])) missing.push(`${short(file)}: --${m[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('carries every colour with its exact value', () => {
    for (const t of tokens.color.tokens) {
      const expected = t.value.startsWith('{') ? `var(--${t.value.slice(1, -1)})` : t.value;
      expect(css).toContain(`--${t.name}: ${expected};`);
    }
  });

  it('declares both fonts with their weight ranges', () => {
    expect(css).toContain('font-family: "IRANYekanX"; src: url("/fonts/IRANYekanXVFaNumVF.woff2")');
    expect(css).toContain('font-weight: 100 1000');
    expect(css).toContain('font-family: "Pofak"');
  });

  it('refuses a reference to a token that does not exist', () => {
    const broken = structuredClone(tokens);
    broken.color.tokens.push({ name: 'focus-ring-2', value: '{no-such-token}', usage: '' });
    expect(() => buildTokensCss(broken)).toThrow(/unknown token no-such-token/);
  });
});

describe('design system v8 (UI review of 4 Aban 1405)', () => {
  it('writes every text size in rem, so it grows with the browser text size (finding 5)', () => {
    const notRem = styles.flatMap((s) => [s.fontSize, s.fontSizeMobile].filter((v): v is string => Boolean(v)).filter((v) => !/^\d+(\.\d+)?rem$/.test(v)).map((v) => `${s.name}: ${v}`));
    expect(notRem).toEqual([]);
  });

  it('gives phones the smaller titles and header (findings 4 and 15)', () => {
    expect(phoneQuery(tokens)).toBe('(max-width: 759.98px)');
    const block = css.slice(css.indexOf(`@media ${phoneQuery(tokens)}`));
    const phone = Object.fromEntries([...block.slice(0, block.indexOf('\n}\n')).matchAll(/--([a-z0-9-]+): ([^;]+);/g)].map((m) => [m[1], m[2]]));
    // 30, 26, 21, 19 and 36 px at the browser's default 16px.
    expect(phone).toMatchObject({
      'type-title-size': '1.875rem',
      'type-heading-1-size': '1.625rem',
      'type-heading-2-size': '1.3125rem',
      'type-lead-size': '1.1875rem',
      'type-display-size': '2.25rem',
      'header-h': '56px',
    });
    // Body, small and the fixed display sizes stay as they are on phones.
    for (const name of ['type-body-size', 'type-small-size', 'type-display-sm-size', 'type-number-size']) expect(phone[name], name).toBeUndefined();
  });

  it('switches every animation off for people who ask for less motion', () => {
    const block = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    for (const t of tokens.duration.tokens) expect(block).toContain(`--${t.name}: 0ms;`);
  });

  it('lets the stylesheets use only the breakpoints of the system (finding 6)', () => {
    const points = new Set(tokens.breakpoint.tokens.map((t) => Number.parseInt(t.value, 10)));
    const off: string[] = [];
    for (const file of stylesheets) {
      for (const media of read(file).matchAll(/@media([^{]*)\{/g)) {
        for (const m of media[1].matchAll(/\((min|max)-width:\s*([\d.]+)px\)/g)) {
          const at = Number(m[2]);
          const ok = m[1] === 'min' ? points.has(at) : points.has(Math.round((at + 0.02) * 100) / 100);
          if (!ok) off.push(`${short(file)}: @media${media[1].trimEnd()}`);
        }
      }
    }
    expect(off).toEqual([]);
  });

  it('takes text sizes, layers and times from tokens, not numbers typed into the CSS (finding 6)', () => {
    const typed: string[] = [];
    for (const file of stylesheets) {
      const text = read(file);
      for (const m of text.matchAll(/(?<![-\w])font-size:\s*[\d.]+px/g)) typed.push(`${short(file)}: ${m[0]}`);
      for (const m of text.matchAll(/(?<![-\w])font:[^;{}]*\d+px/g)) typed.push(`${short(file)}: ${m[0]}`);
      for (const m of text.matchAll(/(?<![-\w])z-index:\s*-?\d/g)) typed.push(`${short(file)}: ${m[0]}`);
      for (const m of text.matchAll(/(?<![-\w])transition:[^;{}]*?(?<![\w-])[\d.]+m?s\b/g)) typed.push(`${short(file)}: ${m[0]}`);
    }
    expect(typed).toEqual([]);
  });
});
