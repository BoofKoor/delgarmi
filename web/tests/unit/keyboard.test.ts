import { describe, expect, it } from 'vitest';
import { KEYBOARD_MIN_PX, keyboardUp } from '@/lib/keyboard';

describe('keyboardUp: when the bottom bar steps aside', () => {
  it('sees the keyboard when the visible part is a keyboard shorter than the layout', () => {
    expect(keyboardUp(844, { height: 844 - 336, scale: 1 })).toBe(true);
  });

  it('brings the bar back once the keyboard closes, whatever has the focus', () => {
    expect(keyboardUp(844, { height: 844, scale: 1 })).toBe(false);
  });

  it('does not take zooming in for a keyboard', () => {
    // Twice the zoom: half as many CSS pixels are visible, and nothing is covered.
    expect(keyboardUp(844, { height: 422, scale: 2 })).toBe(false);
    // Zoomed in with the keyboard up is still the keyboard.
    expect(keyboardUp(844, { height: (844 - 336) / 2, scale: 2 })).toBe(true);
  });

  it("does not take the browser's own bars for a keyboard", () => {
    expect(keyboardUp(844, { height: 844 - 56, scale: 1 })).toBe(false);
    expect(keyboardUp(844, { height: 844 - KEYBOARD_MIN_PX, scale: 1 })).toBe(false);
  });

  it('keeps the bar where the browser cannot tell', () => {
    expect(keyboardUp(844, null)).toBe(false);
    expect(keyboardUp(844, undefined)).toBe(false);
  });
});
