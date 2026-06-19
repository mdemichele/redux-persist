# Changelog
All notable changes to this project should be documented in this file.

The format is (mostly) based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


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
