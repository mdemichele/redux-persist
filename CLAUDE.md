# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run all tests
npm test

# Run a single test file
npx ava tests/persistStore.spec.ts

# Run a single test by title (partial match)
npx ava tests/persistStore.spec.ts --match '*dispatches PERSIST*'

# Build all outputs (CommonJS, ES modules, UMD)
npm run build

# Build individually
npm run build:commonjs   # → lib/
npm run build:es         # → es/
npm run build:umd        # → dist/

# Clean all build artifacts
npm run clean
```

## Architecture

All source lives in `src/`. The library ships three build outputs from the same TypeScript source:
- `lib/` — CommonJS (tsc, `--module commonjs`)
- `es/` — ES modules (tsc, `--module es2015`)
- `dist/` — UMD bundle + minified bundle (Rollup)

**Core data flow:**

1. `persistStore(store)` creates a `Persistor` — a thin Redux store of its own (`persistorReducer`) that tracks which reducer keys have registered and been rehydrated. It immediately dispatches a `PERSIST` action carrying `register` and `rehydrate` callbacks.

2. `persistReducer(config, baseReducer)` wraps a reducer. When it sees the `PERSIST` action it creates a `Persistoid` (via `createPersistoid`), calls `getStoredState` to read from storage, optionally runs migrations (`createMigrate`), then fires `action.rehydrate(key, payload, err)`.

3. `createPersistoid` is the write engine. It maintains a throttled queue of changed keys and writes serialized state to storage via `config.storage.setItem`. The default serializer is `JSON.stringify`.

4. After rehydration, the `REHYDRATE` action runs the state through a **state reconciler** (`autoMergeLevel1` by default) to merge persisted state with the reducer's initial state.

**Key action types** (all prefixed `persist/`, defined in `src/constants.ts`): `PERSIST`, `REHYDRATE`, `REGISTER`, `PURGE`, `FLUSH`, `PAUSE`.

**State reconcilers** (`src/stateReconciler/`):
- `autoMergeLevel1` — default, shallow merge one level deep
- `autoMergeLevel2` — shallow merge two levels deep
- `hardSet` — replaces state entirely with the inbound persisted state

**Storage engines** (`src/storage/`): `createWebStorage` (wraps localStorage/sessionStorage), `getStorage`, `session`. `createMemoryStorage` and `brokenStorage` are test helpers.

**Integration** (`src/integration/react.ts`): exports `PersistGate`, a React component that delays rendering until `persistor.bootstrapped` is true.

## Tests

Tests use [AVA](https://github.com/avajs/ava) and are in `tests/**/*.spec.ts`. Test utilities are in `tests/utils/` (`find.ts`, `sleep.ts`, `createMemoryStorage.ts`, `brokenStorage.ts`). Tests use `redux-mock-store` to supply a store without a real reducer.
