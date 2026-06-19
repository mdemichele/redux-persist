// Writes es/package.json so Node treats es/*.js files as ES modules,
// regardless of the root package.json "type" field.
const fs = require('fs')
const path = require('path')

const pkgPath = path.resolve(__dirname, '..', 'es', 'package.json')
fs.writeFileSync(pkgPath, JSON.stringify({ type: 'module' }, null, 2) + '\n', 'utf8')
console.log('es/package.json written.')
