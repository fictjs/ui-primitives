import { prop } from '@fictjs/runtime'

function copyReactiveProps<TProps extends Record<string, unknown>>(
  source: TProps,
  excludedKeys: ReadonlySet<PropertyKey> = new Set(),
): TProps {
  const target: Record<PropertyKey, unknown> = {}

  for (const key of Reflect.ownKeys(source)) {
    if (excludedKeys.has(key) || !Object.getOwnPropertyDescriptor(source, key)?.enumerable) continue
    target[key] = prop(() => source[key as keyof TProps])
  }

  return target as TProps
}

export { copyReactiveProps }
