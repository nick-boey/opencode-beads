/**
 * Package version and name, read from package.json
 * This ensures version stays in sync with npm package
 */

import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const pkg = require('../package.json') as { version: string; name: string }

export const VERSION: string = pkg.version
export const NAME: string = pkg.name
