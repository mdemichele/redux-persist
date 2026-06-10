# Changelog
All notable changes to this project (after v6.1.0) should be documented in this file.

The format is (mostly) based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [0.0.1] - 2026-06-09

### Changed
- Published to npm as `@mdemichele/redux-persist` (maintained fork of the original `redux-persist`)
- Updated `repository` field in `package.json` to use full object format with `type` and `url`

### Removed
- `src/` from the published `files` array (compiled outputs in `lib/`, `es/`, `dist/` are sufficient)
- Circular self-referencing `redux-persist` runtime dependency from `package.json`
- Stale Travis CI badge from README

## [6.1.0] - 2021-10-17
Thanks to [@smellman](https://github.com/smellman) for the TypeScript updates.

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
