export interface SidecarConfig {
  onError(error: Error): void
}

export const config: SidecarConfig = {
  onError(error) {
    console.error(error)
  },
}

export function setConfig(nextConfig: Partial<SidecarConfig>): void {
  Object.assign(config, nextConfig)
}
