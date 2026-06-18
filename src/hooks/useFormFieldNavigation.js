import { useEffect } from 'react';
import { focusField, getFocusables } from '../utils/formFocus';

const ARROW_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

function isAtHorizontalBoundary(target, key) {
  if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') return true;

  const type = target.type?.toLowerCase?.() ?? 'text';
  if (['number', 'date', 'time', 'month', 'week'].includes(type)) return true;

  const start = target.selectionStart ?? 0;
  const end = target.selectionEnd ?? 0;
  if (start !== end) return false;

  const len = target.value?.length ?? 0;
  if (key === 'ArrowLeft') return start === 0;
  if (key === 'ArrowRight') return end === len;
  return true;
}

function isAtVerticalBoundary(target, key) {
  if (target.tagName !== 'TEXTAREA') return true;

  const start = target.selectionStart ?? 0;
  const end = target.selectionEnd ?? 0;
  if (start !== end) return false;

  const value = target.value ?? '';
  const before = value.slice(0, start);
  const lineIndex = before.split('\n').length - 1;
  const lines = value.split('\n');

  if (key === 'ArrowUp') return lineIndex === 0 && isAtHorizontalBoundary(target, 'ArrowLeft');
  if (key === 'ArrowDown') {
    return lineIndex === lines.length - 1 && isAtHorizontalBoundary(target, 'ArrowRight');
  }
  return true;
}

function canNavigateFrom(target, key) {
  if (key === 'ArrowLeft' || key === 'ArrowRight') {
    return isAtHorizontalBoundary(target, key);
  }
  return isAtVerticalBoundary(target, key);
}

function filterByDirection(candidates, currentRect, key) {
  const threshold = 4;
  return candidates.filter((el) => {
    const rect = el.getBoundingClientRect();
    switch (key) {
      case 'ArrowUp':
        return rect.bottom <= currentRect.top + threshold;
      case 'ArrowDown':
        return rect.top >= currentRect.bottom - threshold;
      case 'ArrowLeft':
        return rect.right <= currentRect.left + threshold;
      case 'ArrowRight':
        return rect.left >= currentRect.right - threshold;
      default:
        return false;
    }
  });
}

function distanceBetween(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function findNearest(candidates, currentCenter, key) {
  let nearest = null;
  let nearestScore = Infinity;

  for (const el of candidates) {
    const rect = el.getBoundingClientRect();
    const center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };

    const primary =
      key === 'ArrowUp' || key === 'ArrowDown'
        ? Math.abs(center.y - currentCenter.y)
        : Math.abs(center.x - currentCenter.x);
    const secondary = distanceBetween(currentCenter, center);

    const score = primary * 1000 + secondary;
    if (score < nearestScore) {
      nearestScore = score;
      nearest = el;
    }
  }

  return nearest;
}

function handleEnterKey(e, container) {
  if (e.key !== 'Enter' || e.nativeEvent?.isComposing) return;
  if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;

  const target = e.target;
  if (!container.contains(target)) return;
  if (target.tagName === 'TEXTAREA') return;
  if (!['INPUT', 'SELECT'].includes(target.tagName)) return;

  const type = target.type?.toLowerCase?.() ?? '';
  if (type === 'file' || type === 'button' || type === 'submit') return;

  const focusables = getFocusables(container);
  const index = focusables.indexOf(target);
  if (index === -1) return;

  const next = focusables[index + 1];
  if (next) {
    e.preventDefault();
    focusField(next);
    return;
  }

  const form = target.closest('form');
  if (form) {
    e.preventDefault();
    if (typeof form.requestSubmit === 'function') {
      form.requestSubmit();
    } else {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
    return;
  }

  const submitBtn = container.querySelector('[data-enter-submit]');
  if (submitBtn) {
    e.preventDefault();
    submitBtn.focus();
  }
}

function handleArrowKey(e, container) {
  if (!ARROW_KEYS.has(e.key)) return;

  const target = e.target;
  if (!container.contains(target)) return;
  if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
  if (!canNavigateFrom(target, e.key)) return;

  const focusables = getFocusables(container);
  const currentIndex = focusables.indexOf(target);
  if (currentIndex === -1) return;

  const currentRect = target.getBoundingClientRect();
  const currentCenter = {
    x: currentRect.left + currentRect.width / 2,
    y: currentRect.top + currentRect.height / 2,
  };

  const candidates = filterByDirection(
    focusables.filter((_, i) => i !== currentIndex),
    currentRect,
    e.key
  );

  const next = findNearest(candidates, currentCenter, e.key);
  if (!next) return;

  e.preventDefault();
  focusField(next);
}

/**
 * Enter advances to the next field; on the last field submits the form (if any)
 * or focuses [data-enter-submit]. Arrow keys move spatially between fields.
 */
export default function useFormFieldNavigation(containerRef, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        handleEnterKey(e, container);
        return;
      }
      handleArrowKey(e, container);
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, enabled]);
}
