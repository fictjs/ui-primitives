import baseConfig from '../../eslint.config.mjs'

export default [
  ...baseConfig,
  {
    files: [
      'src/helpers/element.ts',
      'src/helpers/component-props.ts',
      'src/helpers/extract-props.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
]
