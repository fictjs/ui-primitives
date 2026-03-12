import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { render } from 'fict';
import { HoverCard, Link, Text } from '@fictjs/radix-ui-themes';

const cleanups: Array<() => void> = [];

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

async function flushEffects(cycles = 4) {
  for (let index = 0; index < cycles; index += 1) {
    await new Promise<void>((resolve) => {
      if (typeof queueMicrotask === 'function') {
        queueMicrotask(resolve);
        return;
      }

      Promise.resolve().then(resolve);
    });
  }
}

async function advance(ms: number) {
  await vi.advanceTimersByTimeAsync(ms);
  await flushEffects();
}

describe('themes hover card', () => {
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

  it('closes content after leaving the trigger', async () => {
    const container = document.createElement('div');
    document.body.append(container);

    cleanups.push(
      render(
        () => (
          <HoverCard.Root openDelay={0} closeDelay={20}>
            <HoverCard.Trigger>
              <Link data-testid="trigger">A fancy link</Link>
            </HoverCard.Trigger>
            <HoverCard.Content data-testid="content">
              <Text as="p" size="2">
                Preview
              </Text>
            </HoverCard.Content>
          </HoverCard.Root>
        ),
        container,
      ),
    );

    const trigger = container.querySelector('[data-testid="trigger"]');
    expect(trigger).not.toBeNull();
    expect(document.body.querySelector('[data-testid="content"]')).toBeNull();

    pointerEvent(trigger as Element, 'pointerenter');
    await advance(0);

    const content = document.body.querySelector('[data-testid="content"]');
    expect(content).not.toBeNull();

    const currentTrigger = container.querySelector('[data-testid="trigger"]');
    expect(currentTrigger).not.toBeNull();

    pointerEvent(currentTrigger as Element, 'pointerleave');
    await advance(20);

    expect(document.body.querySelector('[data-testid="content"]')).toBeNull();
  });
});
