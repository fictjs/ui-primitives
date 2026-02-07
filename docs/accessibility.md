# Accessibility Checklist

Use this checklist when building or reviewing primitives.

## Global checks

1. Every interactive element is keyboard reachable (`Tab`, `Shift+Tab`, `Enter`, `Space`, arrow keys where applicable).
2. Focus is always visible and never trapped unless intentionally scoped (`FocusScope`, modal overlays).
3. Interactive controls expose semantic roles and states (`role`, `aria-*`, `data-state`).
4. Dismiss flows are complete: Escape, outside click (when expected), and explicit close action.
5. Dynamic regions (toast/live messages) use polite or assertive live-region semantics.
6. Hidden helper text is exposed only to assistive tech (`VisuallyHidden`, `AccessibleIcon` labels).

## Overlay and popups

- `Dialog` / `AlertDialog`: trigger uses `aria-haspopup`, content has dialog role, title/description IDs are wired, focus enters content and restores on close.
- `Popover` / `HoverCard` / `Tooltip`: trigger/content relationships are explicit (`aria-describedby` for tooltip), and hover/focus behavior has deterministic open/close.
- Modal overlays lock background scroll and block outside interaction where expected.

## Menus and navigation

- Menu roots render proper container roles (`menu`, `menubar`) and items expose matching item roles.
- Checkbox/radio menu items expose checked state (`aria-checked`) and maintain controlled/uncontrolled behavior.
- Roving focus handles arrow-key traversal and loop behavior consistently.
- Navigation content open state is exposed through `data-state` and trigger state attributes.

## Tabs and disclosure

- Tabs: triggers use `role="tab"` + `aria-controls`, content uses `role="tabpanel"` + `aria-labelledby`.
- Accordion/collapsible triggers expose expanded state and toggle content visibility predictably.
- `forceMount` variants keep semantic state in sync while hidden (`data-state="closed"` / inactive).

## Form primitives

- Labels are explicitly associated with controls (`for` / `id`).
- Descriptions and messages are connected through `aria-describedby`.
- Error messages use alert semantics when they need immediate announcement.
- Select/combobox/listbox controls provide role/state attributes for active and selected options.

## Feedback primitives

- Toast viewport has live region semantics and close/action controls have explicit labels.
- Auto-dismiss timing can be overridden and manual dismissal is always possible.

## Verification workflow

1. Run `pnpm test` to verify behavioral and semantic assertions.
2. Run through keyboard-only flows for each updated primitive.
3. Validate screen-reader announcements for dialogs, form errors, and toasts.
