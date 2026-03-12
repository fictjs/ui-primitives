import type { JSX } from 'fict'

type IconProps = JSX.IntrinsicElements['svg']

function ArrowRightIcon(props: IconProps) {
  const { className, ...rest } = props as IconProps & { className?: string }
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest} class={className}>
      <path d="M4 7.5h6m0 0L7.5 5m2.5 2.5L7.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ArrowTopRightIcon(props: IconProps) {
  const { className, ...rest } = props as IconProps & { className?: string }
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest} class={className}>
      <path d="M4 11 11 4m0 0H6.5M11 4v4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StarIcon(props: IconProps) {
  const { className, ...rest } = props as IconProps & { className?: string }
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest} class={className}>
      <path d="M7.5 1.5 9.4 5.3l4.1.6-3 2.9.7 4.1-3.7-2-3.7 2 .7-4.1-3-2.9 4.1-.6L7.5 1.5Z" fill="currentColor" />
    </svg>
  )
}

function Share2Icon(props: IconProps) {
  const { className, ...rest } = props as IconProps & { className?: string }
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest} class={className}>
      <path d="M10.5 4.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="currentColor" />
      <path d="M3 9.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="currentColor" />
      <path d="M10.5 14.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="currentColor" />
      <path d="m4.6 6.1 1.9-1.1m-1.9 4 1.9 1.1" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  )
}

function Pencil2Icon(props: IconProps) {
  const { className, ...rest } = props as IconProps & { className?: string }
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest} class={className}>
      <path d="M10.8 1.3 13.7 4.2 5 12.9 2 13l.1-3L10.8 1.3Z" fill="currentColor" />
    </svg>
  )
}

function CodeIcon(props: IconProps) {
  const { className, ...rest } = props as IconProps & { className?: string }
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest} class={className}>
      <path d="m5.2 3.2-3 4.3 3 4.3M9.8 3.2l3 4.3-3 4.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function InfoCircledIcon(props: IconProps) {
  const { className, ...rest } = props as IconProps & { className?: string }
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest} class={className}>
      <path d="M7.5 14a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z" stroke="currentColor" strokeWidth="1.25" />
      <path d="M7.5 6.4v3.5M7.5 4.6h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function Cross1Icon(props: IconProps) {
  const { className, ...rest } = props as IconProps & { className?: string }
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest} class={className}>
      <path d="M4 4 11 11M11 4 4 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function DotsHorizontalIcon(props: IconProps) {
  const { className, ...rest } = props as IconProps & { className?: string }
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest} class={className}>
      <path d="M3 7.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" fill="currentColor" />
      <path d="M7.5 7.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" fill="currentColor" />
      <path d="M12 7.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" fill="currentColor" />
    </svg>
  )
}

function HamburgerMenuIcon(props: IconProps) {
  const { className, ...rest } = props as IconProps & { className?: string }
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" {...rest} class={className}>
      <path d="M2 4.25h11M2 7.5h11M2 10.75h11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export {
  ArrowRightIcon,
  ArrowTopRightIcon,
  CodeIcon,
  Cross1Icon,
  DotsHorizontalIcon,
  HamburgerMenuIcon,
  InfoCircledIcon,
  Pencil2Icon,
  Share2Icon,
  StarIcon
}
