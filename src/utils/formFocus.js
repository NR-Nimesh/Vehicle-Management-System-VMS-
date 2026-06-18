export const FOCUSABLE_SELECTOR =
  'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])';

export function getFocusables(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null
  );
}

export function focusField(el) {
  el.focus();
  if (el.select && typeof el.select === 'function' && el.tagName !== 'SELECT') {
    el.select();
  }
}
