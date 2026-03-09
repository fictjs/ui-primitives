import { defineConfig } from 'tsup'

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts', 'src/UI.tsx', 'src/sidecar.tsx'],
  format: ['esm', 'cjs'],
  platform: 'neutral',
  sourcemap: true,
  target: 'es2022',
  treeshake: true,
  esbuildOptions(options) {
    options.jsxImportSource = 'fict'
  },
})
