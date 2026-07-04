import type { FictNode } from 'fict'
import { Progress, Grid, Text, Code, Box, Flex, Table } from '@fictjs/radix-ui-themes'
import { progressPropDefs } from '@fictjs/radix-ui-themes/props'
import { DocsSection, DocsSectionBody, DocsSectionHeading } from '../docs-section'
import { accentColorsGrouped } from '../_utils'

export default function ProgressPage() {
  const colorCombinationContent: FictNode[] = accentColorsGrouped.map((group) => [
    <Text as="p" weight="bold" mt="6" mb="4">
      {group.label}
    </Text>,
    <Table.Root>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell />
          {progressPropDefs.variant.values.map((variant) => (
            <Table.RowHeaderCell key={variant}>{variant}</Table.RowHeaderCell>
          ))}
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {group.values.map((color) => (
          <Table.Row key={color}>
            <Table.RowHeaderCell>{color}</Table.RowHeaderCell>
            {progressPropDefs.variant.values.map((variant) => (
              <Table.Cell key={variant} style={{ minWidth: 150 }}>
                <Progress variant={variant} color={color} mt="3" mb="3" />
                <Progress variant={variant} color={color} value={66} mt="5" />
                <Progress variant={variant} color={color} highContrast value={66} mt="5" mb="3" />
              </Table.Cell>
            ))}
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>,
  ])

  return (
    <DocsSection>
      <DocsSectionHeading>Progress</DocsSectionHeading>
      <DocsSectionBody>
        <Flex direction="column" gap="5">
          <div>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell />
                  <Table.ColumnHeaderCell>color</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>+ high-contrast</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>gray</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>+ high-contrast</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {progressPropDefs.variant.values.map((variant, index) => (
                  <Table.Row key={variant}>
                    <Table.RowHeaderCell>{variant}</Table.RowHeaderCell>
                    <Table.Cell style={{ minWidth: 220 }}>
                      <Grid gap="3">
                        <Progress variant={variant} />
                        <Progress variant={variant} value={33 + index * 10} />
                      </Grid>
                    </Table.Cell>
                    <Table.Cell style={{ minWidth: 220 }}>
                      <Grid gap="3">
                        <Progress variant={variant} highContrast />
                        <Progress variant={variant} highContrast value={33 + index * 10} />
                      </Grid>
                    </Table.Cell>
                    <Table.Cell style={{ minWidth: 220 }}>
                      <Grid gap="3">
                        <Progress variant={variant} color="gray" />
                        <Progress variant={variant} color="gray" value={33 + index * 10} />
                      </Grid>
                    </Table.Cell>
                    <Table.Cell style={{ minWidth: 220 }}>
                      <Grid gap="3">
                        <Progress variant={variant} color="gray" highContrast />
                        <Progress
                          variant={variant}
                          color="gray"
                          highContrast
                          value={33 + index * 10}
                        />
                      </Grid>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </div>

          <div>
            <Table.Root>
              <Table.Body>
                {progressPropDefs.size.values.map((size) => (
                  <Table.Row key={size}>
                    <Table.RowHeaderCell>size {size}</Table.RowHeaderCell>
                    <Table.Cell style={{ width: 220 }}>
                      <Progress size={size} />
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </div>
        </Flex>

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
                  {progressPropDefs.size.values.map((size) => (
                    <Table.ColumnHeaderCell key={size}>size {size}</Table.ColumnHeaderCell>
                  ))}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {progressPropDefs.radius.values.map((radius) => (
                  <Table.Row key={radius}>
                    <Table.RowHeaderCell>{radius}</Table.RowHeaderCell>
                    {progressPropDefs.size.values.map((size) => (
                      <Table.Cell key={size} style={{ minWidth: 150 }}>
                        <Progress size={size} radius={radius} value={66} />
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
              See colors
            </Text>
          </summary>
          {colorCombinationContent}
        </details>
      </DocsSectionBody>
    </DocsSection>
  )
}
