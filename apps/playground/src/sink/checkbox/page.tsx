import { DocsSection, DocsSectionBody, DocsSectionHeading } from '../docs-section'
import { Checkbox, Grid, Flex, Text, Code, Box, Separator, Table } from '@fictjs/radix-ui-themes'
import { accentColorsGrouped } from '../_utils'
import { checkboxPropDefs } from '@fictjs/radix-ui-themes/props'
import type { FictNode } from 'fict'

export default function CheckboxPage() {
  const stateMatrixRows: FictNode[] = []
  const colorCombinationContent: FictNode[] = []

  for (const variant of checkboxPropDefs.variant.values) {
    for (const label of [variant, '+ high-contrast'] as const) {
      stateMatrixRows.push(
        <Table.Row key={`${variant}-${label}`}>
          <Table.RowHeaderCell>{label}</Table.RowHeaderCell>
          <Table.Cell>
            <Checkbox variant={variant} highContrast={label === '+ high-contrast'} />
          </Table.Cell>
          <Table.Cell>
            <Checkbox variant={variant} highContrast={label === '+ high-contrast'} defaultChecked />
          </Table.Cell>
          <Table.Cell>
            <Checkbox
              variant={variant}
              highContrast={label === '+ high-contrast'}
              defaultChecked="indeterminate"
            />
          </Table.Cell>
          <Table.Cell>
            <Checkbox variant={variant} highContrast={label === '+ high-contrast'} disabled />
          </Table.Cell>
          <Table.Cell>
            <Checkbox
              variant={variant}
              highContrast={label === '+ high-contrast'}
              disabled
              defaultChecked
            />
          </Table.Cell>
        </Table.Row>,
      )
    }
  }

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
            {checkboxPropDefs.variant.values.map((variant) => (
              <Table.ColumnHeaderCell key={variant}>{variant}</Table.ColumnHeaderCell>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {group.values.map((color) => (
            <Table.Row key={color}>
              <Table.RowHeaderCell>{color}</Table.RowHeaderCell>
              {checkboxPropDefs.variant.values.map((variant) => (
                <Table.Cell key={variant}>
                  <Checkbox variant={variant} color={color} defaultChecked />
                  <Checkbox variant={variant} color={color} highContrast defaultChecked ml="2" />
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
      <DocsSectionHeading>Checkbox</DocsSectionHeading>
      <DocsSectionBody>
        <Grid columns="2" gap="9">
          <div>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell />
                  <Table.ColumnHeaderCell>not checked</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>checked</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>indeterminate</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>disabled</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>disabled checked</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>{stateMatrixRows}</Table.Body>
            </Table.Root>

            <Table.Root>
              <Table.Body>
                {checkboxPropDefs.size.values.map((size) => (
                  <Table.Row key={size}>
                    <Table.RowHeaderCell>size {size}</Table.RowHeaderCell>
                    <Table.Cell>
                      <Flex gap="2">
                        <Checkbox size={size} />
                        <Checkbox size={size} defaultChecked />
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </div>

          <div>
            <Box py="4">
              <Text as="p" size="2">
                Alignment
              </Text>
            </Box>

            <Flex direction="column" gap="5" style={{ maxWidth: 320 }}>
              <Separator size="4" />

              <Text size="1" asChild>
                <label>
                  <Flex gap="2">
                    <Checkbox size="1" />
                    <Text>Agree to Terms and Conditions</Text>
                  </Flex>
                </label>
              </Text>

              <Separator size="4" />

              <Text size="2" asChild>
                <label>
                  <Flex gap="2">
                    <Checkbox size="1" />
                    <Text>Agree to Terms and Conditions</Text>
                  </Flex>
                </label>
              </Text>

              <Separator size="4" />

              <Text size="2" asChild>
                <label>
                  <Flex gap="2">
                    <Checkbox size="2" />
                    <Text>Agree to Terms and Conditions</Text>
                  </Flex>
                </label>
              </Text>

              <Separator size="4" />

              <Text size="3" asChild>
                <label>
                  <Flex gap="2">
                    <Checkbox size="2" />
                    <Text>Agree to Terms and Conditions</Text>
                  </Flex>
                </label>
              </Text>

              <Separator size="4" />

              <Text size="3" asChild>
                <label>
                  <Flex gap="2">
                    <Checkbox size="3" />
                    <Text>Agree to Terms and Conditions</Text>
                  </Flex>
                </label>
              </Text>

              <Separator size="4" />

              <Text size="4" asChild>
                <label>
                  <Flex gap="2">
                    <Checkbox size="3" />
                    <Text>Agree to Terms and Conditions</Text>
                  </Flex>
                </label>
              </Text>

              <Separator size="4" />
            </Flex>
          </div>
        </Grid>

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
