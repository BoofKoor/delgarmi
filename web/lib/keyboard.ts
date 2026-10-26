/**
 * Whether someone is typing with the phone keyboard up, for the bottom bars (design system v8
 * StickyBar steps aside then). A focused text field alone is not enough: Android's back button
 * closes the keyboard and leaves the field focused, and a bar that waited for the field to lose
 * focus would stay away with nothing on screen to bring it back.
 *
 * The keyboard shrinks only the visible part of the page (the visual viewport) and leaves the
 * layout as it is: Chrome on Android since version 108 does what Safari on iOS does
 * (https://developer.chrome.com/blog/viewport-resize-behavior). Zooming in shrinks the visible
 * part too, so the zoom (scale) is taken out first. Where this cannot be told, the bar stays:
 * the page keeps every focused field above it anyway (scroll-padding-bottom).
 */

/** Smaller differences are the browser's own bars appearing and going. */
export const KEYBOARD_MIN_PX = 150;

const TYPED = new Set(['text', 'tel', 'email', 'search', 'number', 'url', 'password']);

/** A field that opens the keyboard: text-like, and not read-only (the verified code field is). */
export function isTypedField(el: Element | null): boolean {
  if (typeof HTMLTextAreaElement !== 'undefined' && el instanceof HTMLTextAreaElement) return !el.readOnly;
  return typeof HTMLInputElement !== 'undefined' && el instanceof HTMLInputElement && TYPED.has(el.type) && !el.readOnly;
}

/** The keyboard is up when the visible part is clearly shorter than the layout. */
export function keyboardUp(layoutHeight: number, visible: { height: number; scale: number } | null | undefined): boolean {
  if (!visible) return false;
  return layoutHeight - visible.height * visible.scale > KEYBOARD_MIN_PX;
}

export function typingWithKeyboard(): boolean {
  return isTypedField(document.activeElement) && keyboardUp(document.documentElement.clientHeight, window.visualViewport);
}

/**
 * Calls `onChange` whenever typing may have started or stopped: focus moving (once it has
 * settled), and the keyboard opening or closing. Returns the clean-up.
 */
export function watchTyping(onChange: () => void): () => void {
  const later = () => window.setTimeout(onChange, 0);
  const viewport = window.visualViewport;
  document.addEventListener('focusin', later);
  document.addEventListener('focusout', later);
  viewport?.addEventListener('resize', onChange);
  return () => {
    document.removeEventListener('focusin', later);
    document.removeEventListener('focusout', later);
    viewport?.removeEventListener('resize', onChange);
  };
}
