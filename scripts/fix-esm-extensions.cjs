// Post-processes the es/ build output to add .js extensions to relative imports.
// Node's ESM resolver requires explicit extensions; tsc with moduleResolution:bundler omits them.
const fs = require('fs')
const path = require('path')

const ESM_DIR = path.resolve(__dirname, '..', 'es')

function addExtensions(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      addExtensions(fullPath)
    } else if (entry.name.endsWith('.js')) {
      const src = fs.readFileSync(fullPath, 'utf8')
      // Match relative import/export paths that have no extension yet
      const patched = src.replace(
        /((?:import|export)[^'"]*from\s+['"])(\.\.?\/[^'"]+?)(['"'])/g,
        (match, prefix, specifier, quote) => {
          if (/\.[a-z]+$/.test(specifier)) return match  // already has extension
          return `${prefix}${specifier}.js${quote}`
        }
      )
      if (patched !== src) fs.writeFileSync(fullPath, patched, 'utf8')
    }
  }
}

addExtensions(ESM_DIR)
console.log('ESM extensions added.')
