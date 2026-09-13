/**
 * Pressable chrome inside the XMB scene — command-bar keycaps, back pills,
 * the paged header title, the progress widget — carries `data-xmb-chrome`.
 * Gesture surfaces (the root category swipe, the carousel scrub, the paged
 * list pan) ignore touches that START on it: the control already acted on
 * pointerdown, so a slide off it must not also read as a swipe or scrub.
 */
export const XMB_CHROME_SELECTOR = '[data-xmb-chrome]';

export function isChromeTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(XMB_CHROME_SELECTOR) !== null;
}
