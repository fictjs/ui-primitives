import { createSignal } from 'fict/advanced';

import { Box, Heading } from '@fictjs/radix-ui-themes';

const primaryButtonStyle = {
  appearance: 'none',
  background: 'var(--red-9)',
  border: '1px solid var(--red-9)',
  borderRadius: 'var(--radius-3)',
  color: 'white',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  minHeight: '36px',
  padding: '0 14px',
  font: 'inherit',
  fontWeight: 500,
} as const;

const softButtonStyle = {
  ...primaryButtonStyle,
  background: 'var(--gray-3)',
  border: '1px solid var(--gray-6)',
  color: 'var(--gray-12)',
};

export default function AlertDialogPage() {
  const open = createSignal(false);
  const setOpen = (value: boolean) => open(value);

  return (
    <section>
      <Heading size="6" as="h2">
        AlertDialog
      </Heading>
      <Box mt="4">
        <button
          id="alert-dialog-demo-open"
          type="button"
          style={primaryButtonStyle}
          onClick={() => open(true)}
        >
          Open
        </button>

        <AlertDialogDemoModal open={open()} setOpen={setOpen} />
      </Box>
    </section>
  );
}

export function AlertDialogDemoModal(props: { open: boolean; setOpen: (value: boolean) => void }) {
  return (
    <div
      id="alert-dialog-demo-overlay"
      style={{
        position: 'fixed',
        inset: '0',
        zIndex: 1000,
        display: props.open ? 'flex' : 'none',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(3, 7, 18, 0.6)',
        padding: '24px',
      }}
      onClick={() => props.setOpen(false)}
    >
      <div
        id="alert-dialog-demo-modal"
        role="alertdialog"
        aria-modal="true"
        aria-hidden={props.open ? 'false' : 'true'}
        style={{
          width: '100%',
          maxWidth: '450px',
          position: 'relative',
          background: 'var(--color-panel-solid)',
          color: 'var(--gray-12)',
          borderRadius: 'var(--radius-4)',
          boxShadow: '0 18px 60px rgba(0, 0, 0, 0.35)',
          padding: '24px',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ margin: 0, fontSize: 'var(--font-size-5)', lineHeight: 'var(--line-height-5)' }}>
            Revoke setup link
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--font-size-3)',
              lineHeight: 'var(--line-height-3)',
              color: 'var(--gray-11)',
            }}
          >
            The setup link will no longer be accessible and any existing setup sessions will be
            revoked.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button
              id="alert-dialog-demo-cancel"
              type="button"
              style={softButtonStyle}
              onClick={() => props.setOpen(false)}
            >
              Cancel
            </button>
            <button
              id="alert-dialog-demo-action"
              type="button"
              style={primaryButtonStyle}
              onClick={() => props.setOpen(false)}
            >
              Revoke link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
