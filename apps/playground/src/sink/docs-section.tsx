import { Box, Flex, Heading } from '@fictjs/radix-ui-themes'

export function DocsSectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <Heading size="6" as="h2">
      {Array.isArray(children) ? children.map((child) => child) : children}
    </Heading>
  )
}

export function DocsSection({ children }: { children: React.ReactNode }) {
  return (
    <Flex asChild direction="column" gap="4">
      <section>{Array.isArray(children) ? children.map((child) => child) : children}</section>
    </Flex>
  )
}

export function DocsSectionBody({ children }: { children: React.ReactNode }) {
  return <Box>{Array.isArray(children) ? children.map((child) => child) : children}</Box>
}
