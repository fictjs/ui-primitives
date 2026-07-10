import { ArrowRightIcon, StarIcon } from '@radix-ui/react-icons'
import { Button, Em, Flex, IconButton, Spinner, Text } from '@fictjs/radix-ui-themes'
import type { buttonPropDefs } from '@fictjs/radix-ui-themes/props'

export function LoadingButtons() {
  return (
    <Flex direction="column" gap="5">
      <LoadingButtonRow size="1" />
      <LoadingButtonRow size="2" />
      <LoadingButtonRow size="3" />
      <LoadingButtonRow size="4" />

      <Text as="p">
        Lorem ipsum, dolor sit amet{' '}
        <span style={{ display: 'inline-block' }}>
          <Spinner>
            <Em>consectetur</Em>
          </Spinner>
        </span>{' '}
        adipisicing elit. Eum veritatis, cupiditate inventore recusandae sapiente corporis non
        similique facere esse praesentium? Dolorum pariatur omnis doloremque unde nam rem ipsa velit
        vitae.
      </Text>
    </Flex>
  )
}

function LoadingButtonRow({ size }: { size: (typeof buttonPropDefs.size.values)[number] }) {
  const iconSize = size === '3' ? '18' : size === '4' ? '20' : '16'
  const spinnerSize = size === '1' ? '1' : size === '4' ? '3' : '2'

  return (
    <Flex gap="5">
      <Flex direction="column" align="center" gap="5">
        <IconButton loading size={size}>
          <StarIcon width={iconSize} height={iconSize} />
        </IconButton>
        <IconButton loading size={size} variant="ghost">
          <StarIcon width={iconSize} height={iconSize} />
        </IconButton>
      </Flex>

      <Flex direction="column" align="center" gap="5">
        <Button loading size={size}>
          Continue
        </Button>
        <Button loading size={size} variant="ghost">
          Continue
        </Button>
      </Flex>

      <Flex direction="column" align="center" gap="5">
        <Button loading size={size}>
          Continue
          <ArrowRightIcon width={iconSize} height={iconSize} />
        </Button>
        <Button loading size={size} variant="ghost">
          Continue
          <ArrowRightIcon width={iconSize} height={iconSize} />
        </Button>
      </Flex>

      <Flex direction="column" align="center" gap="5">
        <Button disabled size={size}>
          Continue
          <Spinner size={spinnerSize}>
            <ArrowRightIcon width={iconSize} height={iconSize} />
          </Spinner>
        </Button>
        <Button disabled size={size} variant="ghost">
          Continue
          <Spinner size={spinnerSize}>
            <ArrowRightIcon width={iconSize} height={iconSize} />
          </Spinner>
        </Button>
      </Flex>
    </Flex>
  )
}
