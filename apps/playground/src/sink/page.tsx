import {
  Button,
  Card,
  Code,
  Flex,
  Grid,
  Heading,
  Link,
  Select,
  Switch,
  Tabs,
  Text,
  TextField,
} from '@fictjs/radix-ui-themes'

const FEATURED_ROUTES = [
  { label: 'Button', href: '#/sink/button', description: 'Variants, radii, colors, and disabled states.' },
  { label: 'Select', href: '#/sink/select', description: 'Trigger/content variants and grouped items.' },
  { label: 'Text Field', href: '#/sink/text-field', description: 'Slots, placeholders, icons, and input sizing.' },
  { label: 'Checkbox Group', href: '#/sink/checkbox-group', description: 'Grouped selection controls and cards.' },
  { label: 'Tabs', href: '#/sink/tabs', description: 'Theme-aware tabs and content panels.' },
  { label: 'Dialog', href: '#/sink/dialog', description: 'Modal overlays and action layouts.' },
]

export default function Sink() {
  return (
    <Flex direction="column" gap="6">
      <Flex direction="column" gap="3">
        <Heading size="7">Fict Radix Themes Playground</Heading>
        <Text size="3" color="gray">
          This playground mirrors the upstream themes sandbox structure, with a sidebar for every
          ported component page and live theme controls in the panel on the right.
        </Text>
        <Flex gap="3" wrap="wrap">
          <Button asChild>
            <a href="#/sink/button">Open component pages</a>
          </Button>
          <Button variant="surface" asChild>
            <a href="#/sink/select">Jump to Select</a>
          </Button>
        </Flex>
      </Flex>

      <Grid columns={{ initial: '1', md: '2', xl: '3' }} gap="4">
        {FEATURED_ROUTES.map((route) => (
          <Card>
            <Flex direction="column" gap="2">
              <Heading size="4">{route.label}</Heading>
              <Text color="gray">{route.description}</Text>
              <Link href={route.href} highContrast>
                View page
              </Link>
            </Flex>
          </Card>
        ))}
      </Grid>

      <Grid columns={{ initial: '1', lg: '2' }} gap="5">
        <Card>
          <Flex direction="column" gap="3">
            <Heading size="4">Quick Form</Heading>
            <TextField.Root placeholder="Search component docs">
              <TextField.Slot>
                <Code>cmd+k</Code>
              </TextField.Slot>
            </TextField.Root>
            <Select.Root defaultValue="button">
              <Select.Trigger />
              <Select.Content>
                <Select.Item value="button">Button</Select.Item>
                <Select.Item value="select">Select</Select.Item>
                <Select.Item value="dialog">Dialog</Select.Item>
              </Select.Content>
            </Select.Root>
            <Flex align="center" justify="between">
              <Text>Enable interactive demos</Text>
              <Switch defaultChecked />
            </Flex>
          </Flex>
        </Card>

        <Card>
          <Flex direction="column" gap="3">
            <Heading size="4">Sample Tabs</Heading>
            <Tabs.Root defaultValue="overview">
              <Tabs.List>
                <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
                <Tabs.Trigger value="components">Components</Tabs.Trigger>
                <Tabs.Trigger value="tokens">Tokens</Tabs.Trigger>
              </Tabs.List>
              <Tabs.Content value="overview">
                <Text color="gray">Use the sidebar to open the ported component showcase pages.</Text>
              </Tabs.Content>
              <Tabs.Content value="components">
                <Text color="gray">Every major `@fictjs/radix-ui-themes` component has its own route.</Text>
              </Tabs.Content>
              <Tabs.Content value="tokens">
                <Text color="gray">ThemePanel lets you test accent color, gray scale, radius, and scaling live.</Text>
              </Tabs.Content>
            </Tabs.Root>
          </Flex>
        </Card>
      </Grid>
    </Flex>
  )
}
