import pluginNodeResolve from '@rollup/plugin-node-resolve'
import pluginCommonjs from '@rollup/plugin-commonjs'
import pluginTypescript from '@rollup/plugin-typescript'
import { babel as pluginBabel } from '@rollup/plugin-babel'
import terser from '@rollup/plugin-terser'

const moduleName = 'ReduxPersist'

import * as path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

import pkg from './package.json' with { type: 'json' }

const banner = `/*!
  ${moduleName}.js v${pkg.version}
  ${pkg.homepage}
  Released under the ${pkg.license} License.
*/`

const filePath = 'dist/redux-persist.js'

const config = [
  // browser
  {
    // entry point
    input: 'src/index.ts',
    output: [
      // no minify
      {
        name: moduleName,
        file: filePath,
        format: 'umd',
        sourcemap: true,
        // copyright
        banner,
      },
      // minify
      {
        name: moduleName,
        file: filePath.replace('.js', '.min.js'),
        format: 'umd',
        sourcemap: true,
        banner,
        plugins: [terser()],
      },
    ],
    plugins: [
      pluginTypescript({
        module: 'esnext',
      }),
      pluginCommonjs({
        extensions: ['.js'],
      }),
      pluginBabel({
        babelHelpers: 'bundled',
        configFile: path.resolve(__dirname, '.babelrc.cjs'),
      }),
      pluginNodeResolve({
        browser: true,
      }),
    ],
  },
]

export default config
