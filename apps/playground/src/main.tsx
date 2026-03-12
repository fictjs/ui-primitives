import { render } from 'fict'

import App from './app.js'
import './globals.css'
import '@fictjs/radix-ui-themes/styles.css'

const root = document.getElementById('app')

if (!root) {
  throw new Error('Missing #app root element')
}

render(() => <App />, root)
