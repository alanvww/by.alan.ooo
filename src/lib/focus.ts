/**
 * Focus an element programmatically without painting the :focus-visible ring.
 * Keyboard-driven route entry (Enter on the XMB menu) makes the browser treat
 * mount-focus as keyboard-initiated, so :focus-visible would match. The
 * data-autofocused mark (set BEFORE focusing) is exempted by the global focus
 * rule in globals.css and clears on the element's first blur, restoring the
 * ring for real Tab visits. Returns an effect-safe cleanup (detaches the
 * listener, removes the mark).
 */
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
