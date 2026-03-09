import { defineConfig } from 'tsup'

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts'],
  external: ['@fictjs/runtime', '@fictjs/runtime/jsx-runtime', '@fictjs/runtime/jsx-dev-runtime'],
  format: ['esm', 'cjs'],
  platform: 'neutral',
  sourcemap: true,
  target: 'es2022',
  treeshake: true,
  esbuildOptions(options) {
    options.jsxImportSource = '@fictjs/runtime'
  },
})
