# Changelog
All notable changes to this project should be documented in this file.

The format is (mostly) based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [7.0.0] - 2026-08-13

### Breaking Changes
- **React 18 or higher is now required** when using `PersistGate`. React is listed as an optional peer dependency (via `peerDependenciesMeta`), so users who do not use `PersistGate` will not receive a peer dependency warning.
- `PersistGate` is now a **named function export** rather than a named class export. Code that uses `instanceof PersistGate` or references `PersistGate.defaultProps` will need to be updated, though typical JSX usage is unchanged.

### Added
- `persistor.pull()` — re-reads storage and replaces the persisted slices of Redux state with what is found there, returning a promise. Useful after returning from bfcache or as a safety net on top of a real cross-tab sync channel. Note: any in-memory state that has not yet been flushed will be overwritten. ([#62](https://github.com/mdemichele/redux-persist/pull/62))
- `createFilesystemStorage(rnBlobUtil)` — new storage adapter for React Native that writes persisted state to the device filesystem via `react-native-blob-util`. Ports the functionality of the unmaintained `redux-persist-filesystem-storage` community package directly into the library. The factory accepts a `ReactNativeBlobUtil` instance so the dependency remains optional and environment-agnostic. ([#65](https://github.com/mdemichele/redux-persist/pull/65))

### Changed
- `PersistGate` rewritten as a functional component using `useSyncExternalStore` (React 18+). This eliminates the tearing risk present in the old class-based implementation under React 18's concurrent renderer: the previous approach read from the persistor inside a class render, which could produce inconsistent snapshots across concurrent renders. ([#31](https://github.com/mdemichele/redux-persist/pull/31))
- `loading` prop on `PersistGate` is now optional (default: `null`). Previously the prop was listed as required in types, though it had a runtime default.
- `persistReducer` now threads the Redux v5 `PreloadedState` type parameter through its signature, preserving type accuracy for apps that pass a preloaded state to `createStore`. A local structural type is used internally for backward compatibility with Redux v4. ([#59](https://github.com/mdemichele/redux-persist/pull/59))

### Fixed
- `getStoredState` now infers `deserialize: false` when `serialize: false` is set without an explicit `deserialize` option. Previously it always defaulted to `JSON.parse` in this case, causing a `SyntaxError` on rehydration because the stored value was already a plain object rather than a JSON string. ([#63](https://github.com/mdemichele/redux-persist/pull/63))
- `PersistGate` is now safe for **SSR and NextJS**: `useSyncExternalStore`'s server snapshot always returns `false`, so the server render always produces the loading state rather than attempting to access storage.
- `onBeforeLift` is now invoked via `Promise.resolve(onBeforeLift())` so that async callbacks correctly delay the gate from lifting until the returned promise settles.

## [6.1.3] - 2026-07-21

### Fixed
- `noopStorage` methods now return `Promise.resolve(null)` instead of `undefined`. Callers in `getStoredState` and `createPersistoid` chain `.then()`/`.catch()` on storage return values, so the previous `undefined` return caused "Cannot read property 'then' of undefined" crashes in SSR and strict private-browsing environments where `localStorage` is unavailable. ([#56](https://github.com/mdemichele/redux-persist/pull/56))
- `writeStagedState` in `createPersistoid` now wraps `serialize()` in a `try/catch`, routing synchronous serialization errors (e.g., `RangeError` from circular references or oversized payloads) to `writeFailHandler` instead of crashing as unhandled exceptions. ([#55](https://github.com/mdemichele/redux-persist/pull/55))
- `createPersistoid` now uses a `setTimeout`-based flush instead of `setInterval` for throttled writes, ensuring all pending key updates are batched into a single write per throttle window rather than firing on a fixed interval regardless of state changes. When `throttle` is `0`, all keys are now processed synchronously. ([#58](https://github.com/mdemichele/redux-persist/pull/58))

## [6.1.2] - 2026-06-23

### Fixed
- Corrected storage import paths throughout the README from `@mdemichele/redux-persist/lib/storage` to `@mdemichele/redux-persist/storage` and `lib/storage/session` to `storage/session`. The `exports` map in `package.json` blocks subpaths not explicitly listed, so the `lib/` variants never worked.
- Added missing `"./storage/session"` entry to the `exports` map in `package.json` so `import storageSession from '@mdemichele/redux-persist/storage/session'` resolves correctly.

## [6.1.1] - 2026-06-18

### Fixed
- `require('@mdemichele/redux-persist')` now works in Node.js CJS environments. The root `"type":"module"` was causing Node to treat the CommonJS `lib/` output as ESM; the CJS build now writes a `lib/package.json` with `{"type":"commonjs"}` to override this in that subdirectory.
- `import from '@mdemichele/redux-persist'` now works in Node.js ESM environments. The ESM `es/` build now patches relative import paths to include `.js` extensions (required by Node's ESM resolver) and writes an `es/package.json` with `{"type":"module"}` so Node correctly identifies the files as ES modules.
- Added a proper `"exports"` field to `package.json` mapping `"require"` to `lib/` and `"import"` to `es/`, covering both the main entry point and `./integration/react`.

## [6.1.0] - 2026-06-18

### Added
- Dev-mode validation in `persistReducer` that warns when nested `_persist` is detected in state, guarding against accidentally persisting a `persistReducer`-wrapped slice inside another `persistReducer`
- Dev-mode validation in `persistReducer` that warns when actions are dispatched before rehydration completes, helping surface premature-dispatch bugs
- Release checklist (`docs/release-checklist.md`) documenting the full npm publish process

### Changed
- Expanded README with detailed API reference, usage examples, state reconciler explanations, and a Roadmap section
- Clarified versioning history in README and CHANGELOG (0.0.1 placeholder → 6.1.0 proper release)

## [0.0.1] - 2026-06-09

### Changed
- Published to npm as `@mdemichele/redux-persist` (maintained fork of the original `redux-persist`)
- Updated `repository` field in `package.json` to use full object format with `type` and `url`

### Removed
- `src/` from the published `files` array (compiled outputs in `lib/`, `es/`, `dist/` are sufficient)
- Circular self-referencing `redux-persist` runtime dependency from `package.json`
- Stale Travis CI badge from README

## [6.1.0] - 2021-10-17 *(never published to npm)*
Thanks to [@smellman](https://github.com/smellman) for the TypeScript updates. This version was merged into the repository but was never released as an npm package. It will be the next version published under `@mdemichele/redux-persist`.

### Added
- TypeScript support
- GitHub Actions

### Changed
- Move from Flow to TypeScript
- Move from TravisCI to GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml))
- Version updates for some dependencies

### Removed
- Flow
- TravisCI

---

*The entries below cover the original [`rt2zz/redux-persist`](https://github.com/rt2zz/redux-persist) release history, included here for continuity.*

## [6.0.0] - 2019-09-02

### Changed
- Upgraded all dependencies
- Improved TypeScript definitions

### Removed
- **BREAKING**: Automatic use of `AsyncStorage` from `react-native`. Storage must now be supplied explicitly. For most React Native apps this means importing from [`@react-native-async-storage/async-storage`](https://github.com/react-native-async-storage/async-storage).

## [5.7.0] - 2018-02-10

### Added
- `timeout` config option on `persistReducer` (default 5000 ms) to handle occasional unresolved `AsyncStorage` promises on React Native Android.

## [5.6.5] - 2018-02-01

### Added
- Transforms now receive the full state object as a third argument.

### Changed
- Persisted state now updates immediately after rehydration rather than waiting for a subsequent action.
- Persisted reducers now pass through unchanged state when the base reducer does not modify it (performance improvement).

### Fixed
- `hardSet` issue when inbound state is `undefined` — state is now only reconciled when inbound state is defined.

## [5.4.0] - 2017-11-19

### Added
- `serialize` boolean option to `persistConfig`. When set to `false`, redux-persist will skip `JSON.parse` / `JSON.stringify` during storage and rehydration.

## [4.6.0] - 2017-04-02

### Changed
- Simplified `process.env.NODE_ENV` access — no longer triggers the webpack polyfill and works with standard envify setups.
- Replaced `process.nextTick` with `setImmediate`.

## [4.0.0] - 2017-01-20

### Added
- UMD and ES module builds.
- Better `localForage` support.
- More comprehensive `localStorage` availability checks.
- TypeScript definitions.
- Flow type definitions.

### Changed
- `config.serialize` is now a boolean option instead of a function. Custom serialization can still be achieved via a transform.
- `liftReducer` now used with `autorehydrate` (fixes a bug with HMR; non-HMR users are unaffected).

### Removed
- **BREAKING**: `purgeAll()` removed — purging all keys is now the default behavior of `purge()`.

## [3.0.0] - 2016-05-05

*No release notes were published for this version.*

## [1.5.3] - 2016-02-12

Last release of the `v1.x` line. Breaking changes were introduced in subsequent `v2.x` development.

## [1.2.0] - 2015-10-24

### Fixed
- `autoRehydrate`: `actionsBuffer` was not working correctly.
- `autoRehydrate`: Object equality for reducer sub-states was incorrectly preserved upon rehydration.

## [1.1.0] - 2015-10-21

### Added
- Configurable debounce for persistence writes.
