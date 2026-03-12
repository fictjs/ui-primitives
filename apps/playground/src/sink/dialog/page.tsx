import { createSignal } from 'fict/advanced';

import { Box, Heading } from '@fictjs/radix-ui-themes';
import { InfoCircledIcon, Share2Icon } from '@radix-ui/react-icons';

const primaryButtonStyle = {
  appearance: 'none',
  background: 'var(--accent-9)',
  border: '1px solid var(--accent-9)',
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

export default function DialogPage() {
  const open = createSignal(false);

  return (
    <section>
      <Heading size="6" as="h2">
        Dialog
      </Heading>
      <Box mt="4">
        <button id="dialog-demo-open" type="button" style={primaryButtonStyle} onClick={() => open(true)}>
          Open
        </button>

        <DialogDemoModal open={open()} setOpen={open} />
      </Box>
    </section>
  );
}

function DialogDemoModal(props: { open: boolean; setOpen: (value: boolean) => void }) {
  return (
    <div
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
        id="dialog-demo-modal"
        role="dialog"
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
          <InfoCircledIcon style={{ position: 'absolute', top: '24px', right: '20px' }} />
          <h3 style={{ margin: 0, fontSize: 'var(--font-size-5)', lineHeight: 'var(--line-height-5)' }}>
            Share resource
          </h3>
          <p
            style={{
              margin: 0,
              fontSize: 'var(--font-size-3)',
              lineHeight: 'var(--line-height-3)',
              color: 'var(--gray-11)',
            }}
          >
            Jan Tschichold was a German calligrapher, typographer and book designer. He played a
            significant role in the development of graphic design in the 20th century.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button
              id="dialog-demo-cancel"
              type="button"
              style={softButtonStyle}
              onClick={() => props.setOpen(false)}
            >
              Cancel
            </button>
            <button
              id="dialog-demo-share"
              type="button"
              style={primaryButtonStyle}
              onClick={() => props.setOpen(false)}
            >
              Share <Share2Icon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
