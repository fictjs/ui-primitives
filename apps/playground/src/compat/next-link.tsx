import type { JSX } from 'fict'

type NextLinkProps = JSX.IntrinsicElements['a'] & {
  scroll?: boolean
}

export default function NextLink(props: NextLinkProps) {
  const {
    children,
    class: classProp,
    className,
    href,
    id,
    onClick,
    rel,
    role,
    scroll: _scroll,
    style,
    tabIndex,
    target,
    title,
    'aria-current': ariaCurrent,
    'aria-label': ariaLabel,
  } = props as NextLinkProps & { class?: string; className?: string }
  const resolvedHref = typeof href === 'string' && href.startsWith('/') ? `#${href}` : href
  return (
    <a
      href={resolvedHref}
      id={id}
      onClick={onClick}
      rel={rel}
      role={role}
      style={style}
      tabIndex={tabIndex}
      target={target}
      title={title}
      aria-current={ariaCurrent}
      aria-label={ariaLabel}
      class={className ?? classProp}
    >
      {children}
    </a>
  )
}
