import { defineConfig } from 'tsup'

export default defineConfig({
  clean: true,
  dts: true,
  entry: ['src/index.ts', 'src/components/**/*.tsx', 'src/helpers/**/*.ts', 'src/props/**/*.ts'],
  format: ['esm', 'cjs'],
  outDir: 'dist',
  platform: 'neutral',
  sourcemap: false,
  splitting: true,
  target: 'es2022',
  treeshake: true,
  esbuildOptions(options) {
    options.jsxImportSource = 'fict'
  },
})
