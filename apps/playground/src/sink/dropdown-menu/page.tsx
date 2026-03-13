import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Button, Code, DropdownMenu, IconButton, Table, Text } from '@fictjs/radix-ui-themes'
import { dropdownMenuContentPropDefs } from '@fictjs/radix-ui-themes/props'

import { DropdownMenuContentDemo } from '../_components'
import { DocsSection, DocsSectionBody, DocsSectionHeading } from '../docs-section'
import { accentColorsGrouped } from '../_utils'

export default function DropdownMenuPage() {
  return (
    <DocsSection>
      <DocsSectionHeading>DropdownMenu</DocsSectionHeading>
      <DocsSectionBody>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Button id="dropdown-menu-demo-trigger" variant="solid">
              More <DropdownMenu.TriggerIcon />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenuContentDemo id="dropdown-menu-demo-content" variant="solid" />
        </DropdownMenu.Root>

        <Text as="p" my="5" color="gray">
          The interactive demo above is the reference menu for E2E coverage. The tables below keep
          the visual prop matrix.
        </Text>

        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell />
              {dropdownMenuContentPropDefs.size.values.map((size) => (
                <Table.ColumnHeaderCell key={size}>{`size ${size}`}</Table.ColumnHeaderCell>
              ))}
              <Table.ColumnHeaderCell>+ high-contrast</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>gray</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>+ high-contrast</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {dropdownMenuContentPropDefs.variant.values.map((variant) => (
              <Table.Row key={variant}>
                <Table.RowHeaderCell>{variant}</Table.RowHeaderCell>
                {dropdownMenuContentPropDefs.size.values.map((size) => (
                  <Table.Cell key={size}>
                    <Button size={size} variant="soft" color="gray">
                      More <DropdownMenu.TriggerIcon />
                    </Button>
                  </Table.Cell>
                ))}
                <Table.Cell>
                  <Button variant="soft" color="gray" highContrast>
                    More <DropdownMenu.TriggerIcon />
                  </Button>
                </Table.Cell>
                <Table.Cell>
                  <Button variant="soft" color="gray">
                    More <DropdownMenu.TriggerIcon />
                  </Button>
                </Table.Cell>
                <Table.Cell>
                  <Button variant="soft" color="gray" highContrast>
                    More <DropdownMenu.TriggerIcon />
                  </Button>
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
          {accentColorsGrouped.map(({ label, values }) => (
            <div key={label} style={{ display: 'contents' }}>
              <Text as="p" weight="bold" mt="6" mb="4">
                {label}
              </Text>
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell />
                    {dropdownMenuContentPropDefs.variant.values.map((variant) => (
                      <Table.ColumnHeaderCell key={variant}>{variant}</Table.ColumnHeaderCell>
                    ))}
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {values.map((color) => (
                    <Table.Row key={color}>
                      <Table.RowHeaderCell>{color}</Table.RowHeaderCell>
                      {dropdownMenuContentPropDefs.variant.values.map((variant) => (
                        <Table.Cell key={variant}>
                          <IconButton variant="soft" color={color}>
                            <DotsHorizontalIcon />
                          </IconButton>
                          <IconButton variant="soft" color={color} highContrast ml="2">
                            <DotsHorizontalIcon />
                          </IconButton>
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </div>
          ))}
        </details>
      </DocsSectionBody>
    </DocsSection>
  )
}
