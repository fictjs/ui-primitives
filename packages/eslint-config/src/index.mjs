import eslint from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default function createConfig() {
  const typeCheckedForTs = tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ['**/*.{ts,mts,cts}'],
  }))

  const disableTypeCheckedForJs = {
    ...tseslint.configs.disableTypeChecked,
    files: ['**/*.{js,mjs,cjs}'],
  }

  return tseslint.config(
    {
      ignores: ['**/.turbo/**', '**/coverage/**', '**/dist/**', '**/node_modules/**'],
    },
    eslint.configs.recommended,
    ...typeCheckedForTs,
    {
      files: ['**/*.{ts,mts,cts}'],
      languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        globals: {
          ...globals.node,
        },
        parserOptions: {
          projectService: true,
          tsconfigRootDir: process.cwd(),
        },
      },
      rules: {
        '@typescript-eslint/consistent-type-imports': [
          'error',
          {
            fixStyle: 'inline-type-imports',
          },
        ],
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
          },
        ],
      },
    },
    {
      files: ['**/*.{js,mjs,cjs}'],
      languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        globals: {
          ...globals.node,
        },
      },
    },
    disableTypeCheckedForJs,
    {
      files: ['**/*.test.{ts,mts,cts}'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: ['**/*.config.{ts,mts,cts,mjs}', '**/*.workspace.ts'],
      rules: {
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
      },
    },
  )
}
