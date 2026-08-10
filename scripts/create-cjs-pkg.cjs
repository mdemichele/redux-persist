// Writes lib/package.json to mark the CJS build output as CommonJS,
// overriding the root "type":"module" just for that subdirectory.
const fs = require('fs')
const path = require('path')

const pkgPath = path.resolve(__dirname, '..', 'lib', 'package.json')
fs.writeFileSync(pkgPath, JSON.stringify({ type: 'commonjs' }, null, 2) + '\n', 'utf8')
console.log('lib/package.json written.')
