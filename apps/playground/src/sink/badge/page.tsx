import { Badge, Box, Code, Flex, Text, Table } from '@fictjs/radix-ui-themes'
import { badgePropDefs } from '@fictjs/radix-ui-themes/props'
import { DocsSection, DocsSectionBody, DocsSectionHeading } from '../docs-section'
import { accentColorsGrouped, upperFirst } from '../_utils'
import type { FictNode } from 'fict'

export default function BadgePage() {
  const colorCombinationContent: FictNode[] = []

  for (const group of accentColorsGrouped) {
    colorCombinationContent.push(
      <Text key={`${group.label}-heading`} as="p" weight="bold" mt="6" mb="4">
        {group.label}
      </Text>,
    )
    colorCombinationContent.push(
      <Table.Root key={`${group.label}-table`}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell />
            {badgePropDefs.variant.values.map((variant) => (
              <Table.ColumnHeaderCell key={variant}>{variant}</Table.ColumnHeaderCell>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {group.values.map((color) => (
            <Table.Row key={color}>
              <Table.RowHeaderCell>{color}</Table.RowHeaderCell>
              {badgePropDefs.variant.values.map((variant) => (
                <Table.Cell key={variant}>
                  <Flex direction="column" align="start" gap="1">
                    <Badge variant={variant} color={color}>
                      {color}
                    </Badge>
                    <Badge variant={variant} color={color} highContrast>
                      {color}
                    </Badge>
                  </Flex>
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>,
    )
  }

  return (
    <DocsSection>
      <DocsSectionHeading>Badge</DocsSectionHeading>
      <DocsSectionBody>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell />
              {badgePropDefs.size.values.map((size) => (
                <Table.ColumnHeaderCell key={size}>size {size}</Table.ColumnHeaderCell>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {badgePropDefs.variant.values.map((variant) => (
              <Table.Row key={variant}>
                <Table.RowHeaderCell>{variant}</Table.RowHeaderCell>
                {badgePropDefs.size.values.map((size) => (
                  <Table.Cell key={size}>
                    <Flex key={variant} gap="3" wrap="wrap" style={{ maxWidth: 600 }}>
                      {(['orange', 'violet', 'cyan', 'gray'] as const).map((color) => (
                        <Flex key={color} direction="column" gap="1">
                          <Badge size={size} variant={variant} color={color}>
                            {upperFirst(color)}
                          </Badge>
                        </Flex>
                      ))}
                    </Flex>
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>

        <Text as="p" my="5">
          <Code>radius</Code> can be set per instance:
        </Text>

        <details>
          <summary>
            <Text size="2" color="gray">
              See specific radius examples
            </Text>
          </summary>
          <Box mt="3">
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell />
                  {badgePropDefs.size.values.map((size) => (
                    <Table.ColumnHeaderCell key={size}>size {size}</Table.ColumnHeaderCell>
                  ))}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {badgePropDefs.radius.values.map((radius) => (
                  <Table.Row key={radius}>
                    <Table.RowHeaderCell>{radius}</Table.RowHeaderCell>
                    {badgePropDefs.size.values.map((size) => (
                      <Table.Cell key={size}>
                        <Badge size={size} radius={radius}>
                          {upperFirst(radius)}
                        </Badge>
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        </details>

        <Text as="p" my="5">
          <Code>color</Code> can be set per instance:
        </Text>

        <details>
          <summary>
            <Text size="2" color="gray">
              See colors & variants combinations
            </Text>
          </summary>
          {colorCombinationContent}
        </details>
      </DocsSectionBody>
    </DocsSection>
  )
}
