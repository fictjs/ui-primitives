import { CheckboxCards, Box, Text, Code, Flex, Table } from '@fictjs/radix-ui-themes'
import { CodeIcon } from '@radix-ui/react-icons'
import { checkboxCardsRootPropDefs } from '@fictjs/radix-ui-themes/props'
import { DocsSection, DocsSectionBody, DocsSectionHeading } from '../docs-section'
import { accentColorsGrouped } from '../_utils'
import type { FictNode } from 'fict'

export default function CheckboxCardsPage() {
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
            {checkboxCardsRootPropDefs.variant.values.map((variant) => (
              <Table.ColumnHeaderCell key={variant}>{variant}</Table.ColumnHeaderCell>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {group.values.map((color) => (
            <Table.Row key={color}>
              <Table.RowHeaderCell>{color}</Table.RowHeaderCell>
              {checkboxCardsRootPropDefs.variant.values.map((variant) => (
                <Table.Cell key={variant}>
                  <Flex direction="column" gap="2">
                    <CheckboxCards.Root
                      defaultValue={['0']}
                      size="1"
                      gap="2"
                      columns="3"
                      variant={variant}
                      color={color}
                      style={{ width: 400 }}
                    >
                      <CheckboxCards.Item value="0">Node.js</CheckboxCards.Item>
                      <CheckboxCards.Item value="1" disabled>
                        Ruby
                      </CheckboxCards.Item>
                      <CheckboxCards.Item value="2">Go</CheckboxCards.Item>
                    </CheckboxCards.Root>

                    <CheckboxCards.Root
                      defaultValue={['0']}
                      size="1"
                      gap="2"
                      columns="3"
                      variant={variant}
                      color={color}
                      highContrast
                      style={{ width: 400 }}
                    >
                      <CheckboxCards.Item value="0">Node.js</CheckboxCards.Item>
                      <CheckboxCards.Item value="1" disabled>
                        Ruby
                      </CheckboxCards.Item>
                      <CheckboxCards.Item value="2">Go</CheckboxCards.Item>
                    </CheckboxCards.Root>
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
      <DocsSectionHeading>CheckboxCards</DocsSectionHeading>
      <DocsSectionBody>
        <Table.Root>
          <Table.Body>
            {checkboxCardsRootPropDefs.variant.values.map((variant, index) => (
              <Table.Row key={variant}>
                <Table.RowHeaderCell>{variant}</Table.RowHeaderCell>
                <Table.Cell>
                  <CheckboxCards.Root defaultValue={[String(index)]} columns="3" variant={variant}>
                    <CheckboxCards.Item value="0">
                      <CodeIcon />
                      <Text truncate>Node.js</Text>
                    </CheckboxCards.Item>
                    <CheckboxCards.Item value="1" disabled>
                      Ruby
                    </CheckboxCards.Item>
                    <CheckboxCards.Item value="2">Go</CheckboxCards.Item>
                  </CheckboxCards.Root>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>

        <Box mb="7" />

        <Table.Root>
          <Table.Body>
            {checkboxCardsRootPropDefs.size.values.map((size, index) => (
              <Table.Row key={size}>
                <Table.RowHeaderCell>size {size}</Table.RowHeaderCell>
                <Table.Cell>
                  <CheckboxCards.Root
                    defaultValue={[String(index)]}
                    size={size}
                    columns="3"
                    style={{ width: 400 + Number(size) * 100 }}
                  >
                    <CheckboxCards.Item value="0">Node.js</CheckboxCards.Item>
                    <CheckboxCards.Item value="1" disabled>
                      Ruby
                    </CheckboxCards.Item>
                    <CheckboxCards.Item value="2">Go</CheckboxCards.Item>
                  </CheckboxCards.Root>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>

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
