/**
 * Focus an element programmatically without painting the :focus-visible ring.
 * Keyboard-driven route entry (Enter on the XMB menu) makes the browser treat
 * mount-focus as keyboard-initiated, so :focus-visible would match. The
 * data-autofocused mark (set BEFORE focusing) is exempted by the global focus
 * rule in globals.css and clears on the element's first blur, restoring the
 * ring for real Tab visits. Returns an effect-safe cleanup (detaches the
 * listener, removes the mark).
 */
/**
 * Move focus to an adjacent roving-tabindex sibling (`${idPrefix}${index ± 1}`)
 * in response to a Tab press inside a list. The focus is deliberately LOUD
 * (no data-autofocused mark): Tab is browser-style traversal, so the focus
 * ring must paint on the item it lands on. Returns true when a sibling took
 * focus (caller prevents the default and plays the tick); false at a list
 * boundary, where the caller lets native Tab exit the list (2.1.2 — no trap).
 */
export function focusListSibling(idPrefix: string, index: number, direction: 1 | -1): boolean {
  const next = document.getElementById(`${idPrefix}${index + direction}`);
  if (!next) return false;
  next.focus({ preventScroll: true });
  return true;
}

export function focusSilently(el: HTMLElement): () => void {
  el.setAttribute('data-autofocused', '');
  const clear = (): void => el.removeAttribute('data-autofocused');
  el.addEventListener('blur', clear, { once: true });
  // focusVisible is honored natively by Firefox; Chromium/WebKit ignore the
  // unknown member (the attribute covers them). Not yet in lib.dom.d.ts.
  el.focus({ preventScroll: true, focusVisible: false } as FocusOptions & { focusVisible?: boolean });
  return () => {
    el.removeEventListener('blur', clear);
    clear();
  };
}
