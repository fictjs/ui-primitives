export default {
  '*.{js,mjs,cjs,ts,mts,cts}': ['eslint --fix --max-warnings=0', 'prettier --write'],
  '*.{css,json,md,yml,yaml}': ['prettier --write'],
}
