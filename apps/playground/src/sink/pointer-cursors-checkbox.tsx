import { onCleanup, onMount } from 'fict';
import { Box, Flex, Text } from '@fictjs/radix-ui-themes';

const POINTER_CURSOR_STYLE = `
  .radix-themes:has([data-pointer-cursor-toggle="true"]:checked) {
    --cursor-button: pointer;
    --cursor-checkbox: pointer;
    --cursor-disabled: default;
    --cursor-link: pointer;
    --cursor-menu-item: pointer;
    --cursor-radio: pointer;
    --cursor-slider-thumb: grab;
    --cursor-slider-thumb-active: grabbing;
    --cursor-switch: pointer;
  }
`;

export function PointerCursorsCheckbox() {
  let styleElement: HTMLStyleElement | undefined;

  onMount(() => {
    styleElement = document.createElement('style');
    styleElement.dataset.pointerCursorStyle = 'true';
    styleElement.textContent = POINTER_CURSOR_STYLE;
    document.head.append(styleElement);
  });

  onCleanup(() => {
    styleElement?.remove();
    styleElement = undefined;
  });

  return (
    <Box>
      <Text as="label" size="2">
        <Flex gap="2">
          <input aria-label="Use pointer cursors" data-pointer-cursor-toggle="true" type="checkbox" />
          Use pointer cursors
        </Flex>
      </Text>
    </Box>
  );
}
