import type { JSX } from 'fict'

type NextLinkProps = JSX.IntrinsicElements['a'] & {
  scroll?: boolean
}

export default function NextLink(props: NextLinkProps) {
  const { href, scroll: _scroll, ...anchorProps } = props
  const resolvedHref = typeof href === 'string' && href.startsWith('/') ? `#${href}` : href
  return <a {...anchorProps} href={resolvedHref} />
}
