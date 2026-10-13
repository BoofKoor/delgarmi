import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error -- plain ES module without type declarations
import { buildTokensCss } from '../../scripts/build-tokens.mjs';
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

describe('tokens.css', () => {
  it('defines every variable the stylesheets use', () => {
    const defined = new Set([...css.matchAll(/--([a-z0-9-]+):/g)].map((m) => m[1]));
    const files = [...cssFiles(join(root, 'design')), ...cssFiles(join(root, 'styles')), ...cssFiles(join(root, 'app'))];
    expect(files.length).toBeGreaterThan(2);
    const missing: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      const localDefs = new Set([...text.matchAll(/--([a-z0-9-]+):/g)].map((m) => m[1]));
      for (const m of text.matchAll(/var\(--([a-z0-9-]+)/g)) {
        if (!defined.has(m[1]) && !localDefs.has(m[1])) missing.push(`${file.slice(root.length + 1)}: --${m[1]}`);
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
