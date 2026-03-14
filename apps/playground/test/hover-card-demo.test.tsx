import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { render } from 'fict';

import HoverCardPage from '../src/sink/hover-card/page';

const cleanups: Array<() => void> = [];

function flush() {
  return new Promise<void>((resolve) => {
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(resolve);
      return;
    }

    Promise.resolve().then(resolve);
  });
}

function pointerEvent(target: Element, type: string, init: PointerEventInit = {}) {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerType: 'mouse',
      ...init,
    }),
  );
}

async function advance(ms: number) {
  await vi.advanceTimersByTimeAsync(ms);
  await flush();
}

describe('playground hover card demo', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    while (cleanups.length > 0) {
      cleanups.pop()?.();
    }
    vi.useRealTimers();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('shows content on hover and hides it on pointer leave', async () => {
    const container = document.createElement('div');
    document.body.append(container);

    cleanups.push(render(() => <HoverCardPage />, container));

    await flush();

    const trigger = Array.from(container.querySelectorAll('a')).find(
      (link) => link.textContent?.trim() === 'A fancy link',
    );
    expect(trigger).not.toBeNull();
    expect(document.body.querySelector('.rt-HoverCardContent')).toBeNull();

    pointerEvent(trigger as Element, 'pointerenter');
    await advance(200);

    expect(document.body.querySelector('.rt-HoverCardContent')).not.toBeNull();

    const currentTrigger = Array.from(container.querySelectorAll('a')).find(
      (link) => link.textContent?.trim() === 'A fancy link',
    );
    expect(currentTrigger).not.toBeNull();

    pointerEvent(currentTrigger as Element, 'pointerleave');
    await advance(170);

    expect(document.body.querySelector('.rt-HoverCardContent')).toBeNull();
  });
});
