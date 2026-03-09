export default {
  '*.{js,mjs,cjs,ts,mts,cts}': ['eslint --fix --max-warnings=0', 'prettier --write'],
  '*.{json,md,yml,yaml}': ['prettier --write'],
}
