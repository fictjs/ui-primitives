export default {
  '*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}': ['eslint --fix --max-warnings=0', 'prettier --write'],
  '*.{css,json,md,yml,yaml}': ['prettier --write'],
}
