import NextLink from 'next/link'

import { Box, Container, Flex, Grid, Heading, Link, Reset, Separator } from '@fictjs/radix-ui-themes'

import { RadixLogo } from './radix-logo'
import { sinkRoutes } from './routes'

export default function SinkLayout(props: { children: React.ReactNode }) {
  return (
    <Container size="4" maxWidth="1680px">
      <Grid
        areas={{ initial: '"header" "separator" "main"', md: '"main separator header"' }}
        columns={{ initial: '1', md: '1fr 1px 360px', xl: '1fr 1px 480px' }}
        rows={{ initial: 'auto 1px 1fr', md: '1' }}
        height="100%"
        minHeight="100svh"
      >
        <Box
          gridArea="header"
          position={{ initial: undefined, md: 'sticky' }}
          top={{ initial: undefined, md: '0' }}
          alignSelf={{ initial: undefined, md: 'start' }}
          maxHeight={{ initial: undefined, md: '100svh' }}
          overflow={{ initial: undefined, md: 'auto' }}
          pt={{ initial: '4', md: '9' }}
          pb={{ initial: '4', md: '9' }}
        >
          <Container mx="4" size="4">
            <Flex direction="column" gap="4">
              <Flex align="center" gap="2">
                <RadixLogo />
                <Heading size="5">Fict Radix Themes</Heading>
              </Flex>
              <NavigationMenu />
            </Flex>
          </Container>
        </Box>
        <Box asChild gridArea="separator">
          <Separator size="4" aria-hidden orientation={{ initial: 'horizontal', md: 'vertical' }} />
        </Box>
        <Box gridArea="main" py={{ initial: '6', md: '9' }}>
          <main>
            <Container mx="4" size="4" position="relative" width="100%" height="100%">
              {props.children}
            </Container>
          </main>
        </Box>
      </Grid>
    </Container>
  )
}

function NavigationMenu() {
  return (
    <Flex direction="column" gap="2">
      <Link asChild highContrast>
        <NextLink href="/sink">Kitchen sink</NextLink>
      </Link>
      <Separator size="4" />
      <Flex direction="column" gap="1" asChild>
        <Reset>
          <ul>
            {sinkRoutes.map((item) => (
              <Box display="contents" asChild key={item.label}>
                <li>
                  <Link asChild highContrast>
                    <NextLink href={`/sink${item.href ? '/' + item.href : ''}`}>{item.label}</NextLink>
                  </Link>
                </li>
              </Box>
            ))}
          </ul>
        </Reset>
      </Flex>
    </Flex>
  )
}
