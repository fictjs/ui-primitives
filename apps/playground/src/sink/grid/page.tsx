import { Box, Grid } from '@fictjs/radix-ui-themes'
import { DocsSection, DocsSectionBody, DocsSectionHeading } from '../docs-section'

export default function GridPage() {
  return (
    <DocsSection>
      <DocsSectionHeading>Grid</DocsSectionHeading>
      <DocsSectionBody>
        <Grid columns={{ initial: '1', md: '2', lg: '3' }} gap="3" mb="8">
          <Box style={{ height: 256 }}>
            <Grid gap="3" style={{ height: 256 }}>
              {Array.from(Array(4).keys()).map((i) => (
                <Box key={i} style={{ height: 55, background: 'var(--accent-9)' }} />
              ))}
            </Grid>
          </Box>

          <Box style={{ height: 256 }}>
            <Grid columns="5" gap="3" height="100%">
              {Array.from(Array(5).keys()).map((i) => (
                <Box key={i} style={{ background: 'var(--accent-9)' }} />
              ))}
            </Grid>
          </Box>

          <Box style={{ height: 256 }}>
            <Grid columns={{ initial: '5' }} gap="3" height="100%">
              {Array.from(Array(20).keys()).map((i) => (
                <Box key={i} style={{ background: 'var(--accent-9)' }} />
              ))}
            </Grid>
          </Box>
        </Grid>

        <Grid gap="3" columns="4">
          <Grid gap="3" columns="1fr 1fr 2fr">
            {Array.from(Array(3).keys()).map((i) => (
              <Box key={i} style={{ height: 55, background: 'var(--accent-9)' }} />
            ))}
          </Grid>

          <Grid gap="3" columns={{ xs: '3', md: '1fr 1fr 2fr' }}>
            {Array.from(Array(3).keys()).map((i) => (
              <Box key={i} style={{ height: 55, background: 'var(--accent-9)' }} />
            ))}
          </Grid>

          <Grid gap="3" columns={{ xs: '3', md: '1fr 1fr 2fr', lg: '3' }}>
            {Array.from(Array(3).keys()).map((i) => (
              <Box key={i} style={{ height: 55, background: 'var(--accent-9)' }} />
            ))}
          </Grid>

          <Grid gap="1" columns={{ xs: '20' }}>
            {Array.from(Array(20).keys()).map((i) => (
              <Box key={i} style={{ height: 55, background: 'var(--accent-9)' }} />
            ))}
          </Grid>
        </Grid>
      </DocsSectionBody>
    </DocsSection>
  )
}
