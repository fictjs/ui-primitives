import { Avatar, Box, Code, Flex, Table, Text } from '@fictjs/radix-ui-themes'
import { avatarPropDefs } from '@fictjs/radix-ui-themes/props'
import { avatarUrl } from '../../avatar'
import { DocsSection, DocsSectionBody, DocsSectionHeading } from '../docs-section'
import { CustomUserIcon } from '../_components'
import { accentColorsGrouped } from '../_utils'
import type { FictNode } from 'fict'

export default function AvatarPage() {
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
            {avatarPropDefs.variant.values.map((variant) => (
              <Table.ColumnHeaderCell key={variant}>{variant}</Table.ColumnHeaderCell>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {group.values.map((color) => (
            <Table.Row key={color}>
              <Table.RowHeaderCell>{color}</Table.RowHeaderCell>
              {avatarPropDefs.variant.values.map((variant) => (
                <Table.Cell key={variant}>
                  <Avatar variant={variant} color={color} fallback="D" />
                  <Avatar variant={variant} color={color} highContrast fallback="D" ml="2" />
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
      <DocsSectionHeading>Avatar</DocsSectionHeading>
      <DocsSectionBody>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell />
              <Table.ColumnHeaderCell>image</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>1 letter</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>2 letters</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>icon</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>+ high-contrast</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>gray</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>+ high-contrast</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {avatarPropDefs.variant.values.map((variant) => (
              <Table.Row key={variant}>
                <Table.RowHeaderCell>{variant}</Table.RowHeaderCell>
                <Table.Cell>
                  <Avatar variant={variant} src={avatarUrl} fallback="D" />
                </Table.Cell>
                <Table.Cell>
                  <Avatar variant={variant} fallback="D" />
                </Table.Cell>
                <Table.Cell>
                  <Avatar variant={variant} fallback="BG" />
                </Table.Cell>
                <Table.Cell>
                  <Avatar variant={variant} fallback={<CustomUserIcon />} />
                </Table.Cell>
                <Table.Cell>
                  <Avatar variant={variant} highContrast fallback="D" />
                </Table.Cell>
                <Table.Cell>
                  <Avatar variant={variant} color="gray" fallback="D" />
                </Table.Cell>
                <Table.Cell>
                  <Avatar variant={variant} color="gray" highContrast fallback="D" />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>

        <Table.Root>
          <Table.Body>
            {avatarPropDefs.size.values.map((size) => (
              <Table.Row key={size}>
                <Table.RowHeaderCell>{size}</Table.RowHeaderCell>
                <Table.Cell>
                  <Flex gap="3">
                    <Avatar size={size} src={avatarUrl} fallback="D" />
                    <Avatar size={size} fallback="D" />
                    <Avatar size={size} fallback="BG" />
                  </Flex>
                </Table.Cell>
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
                  {avatarPropDefs.size.values.map((size) => (
                    <Table.ColumnHeaderCell key={size}>size {size}</Table.ColumnHeaderCell>
                  ))}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {avatarPropDefs.radius.values.map((radius) => (
                  <Table.Row key={radius}>
                    <Table.RowHeaderCell>{radius}</Table.RowHeaderCell>
                    {avatarPropDefs.size.values.map((size) => (
                      <Table.Cell key={size}>
                        <Avatar size={size} radius={radius} src={avatarUrl} fallback="D" />
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
