import { exportSidecar } from '@fictjs/use-sidecar'

import { RemoveScrollSideCar } from './SideEffect.js'
import { effectCar } from './medium.js'

export default exportSidecar(effectCar as any, RemoveScrollSideCar as any)
