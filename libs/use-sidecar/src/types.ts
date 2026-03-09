import type { FictNode } from '@fictjs/runtime'

export type RemoveCallback = () => void
export type Accessor<T> = () => T
export type MediumCallback<T> = (data: T) => void
export type MiddlewareCallback<T> = (data: T, assigned: boolean) => T
export type SidePush<T> = {
  length?: number
  push(data: T): void
  filter(cb: (value: T) => boolean): SidePush<T>
}

export type FictComponent<TProps = Record<string, unknown>> = (props: TProps) => FictNode

export interface SideMedium<T> {
  useMedium(effect: T): RemoveCallback
  assignMedium(handler: MediumCallback<T>): void
  assignSyncMedium(handler: MediumCallback<T>): void
  read(): T | undefined
  options?: Record<string, unknown>
}

export type DefaultOrNot<T> = { default: T } | T

export type Importer<TProps = Record<string, unknown>> = () => Promise<
  DefaultOrNot<FictComponent<TProps>>
>

export type SideCarMedium<TProps = Record<string, unknown>> = SideMedium<FictComponent<TProps>>

export type SideCarHOC<TProps = Record<string, unknown>> = {
  readonly sideCar: SideCarMedium<TProps>
}

export type SideCarComponent<TProps = Record<string, unknown>> = FictComponent<
  TProps & SideCarHOC<TProps>
>

export interface SideCarMediumOptions {
  async?: boolean
  ssr?: boolean
}
