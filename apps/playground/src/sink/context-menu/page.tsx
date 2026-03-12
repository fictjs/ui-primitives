import { Table, Text } from '@fictjs/radix-ui-themes'
import { contextMenuContentPropDefs } from '@fictjs/radix-ui-themes/props'

import { DocsSection, DocsSectionBody, DocsSectionHeading } from '../docs-section'
import { RightClickArea } from '../_components'

export default function ContextMenuPage() {
  return (
    <DocsSection>
      <DocsSectionHeading>ContextMenu</DocsSectionHeading>
      <DocsSectionBody>
        <Text as="p" color="gray" mb="4">
          Right-click the targets below to inspect the themed context menu states.
        </Text>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              {contextMenuContentPropDefs.size.values.map((size) => (
                <Table.ColumnHeaderCell key={size}>{`size ${size}`}</Table.ColumnHeaderCell>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {contextMenuContentPropDefs.variant.values.map((variant) => (
              <Table.Row key={variant}>
                {contextMenuContentPropDefs.size.values.map((size) => (
                  <Table.Cell key={size}>
                    <RightClickArea size={size} />
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </DocsSectionBody>
    </DocsSection>
  )
}
