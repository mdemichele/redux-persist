# Redux Persist
Persist and rehydrate a redux store.

[![npm version](https://img.shields.io/npm/v/@mdemichele/redux-persist.svg?style=flat-square)](https://www.npmjs.com/package/@mdemichele/redux-persist) [![npm downloads](https://img.shields.io/npm/dm/@mdemichele/redux-persist.svg?style=flat-square)](https://www.npmjs.com/package/@mdemichele/redux-persist)

## Overview

Redux state lives entirely in memory and resets on every page refresh or app restart. redux-persist solves this by automatically saving your Redux store to a storage engine (such as `localStorage` on web or `AsyncStorage` on React Native) and restoring it when the application reloads — with no changes required to your existing reducers or actions.

Beyond basic persistence, the library also handles state shape migrations as your app evolves, lets you choose exactly which slices of state to save via whitelists and blacklists, and provides a `PersistGate` React component to delay rendering until rehydration is complete.

For a deeper look at the problem this project solves and why it was built, see [docs/project-purpose.md](./docs/project-purpose.md).

> **Note on versioning:** The initial `v0.0.1` npm release was a proof-of-concept publish to establish the `@mdemichele/redux-persist` package name. The first real release was `v6.1.0`, aligning with the actual version of the codebase (the TypeScript fork) and providing a meaningful starting point for future semantic versioning.

## Project Timeline

- June 9, 2026: v0.0.1 released to npm as `@mdemichele/redux-persist`. Following a regular release cadence from here on.
- February 16, 2025: New Fork Created. I'm hoping we can revive this project and get it actively maintained again.
- October 15th, 2021: Move to TypeScript (Thanks [@smellman](https://github.com/smellman))
  - As part of the work to upgrade the infrastructure used to build redux-persist, we're moving from Flow to TypeScript.
  - Move from TravisCI to GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml))
  - Version updates for some dependencies
- September 22nd, 2021 - Under New Management
  - ([@ckalika](https://github.com/ckalika)) did great work taking over maintenance of the project from [@rt2zz](https://github.com/rt2zz)
- July 22nd, 2015: Project originally created by [@rt2zz](https://github.com/rt2zz)


## Quickstart
`npm install @mdemichele/redux-persist`

Usage Examples:
1. [Basic Usage](#basic-usage)
2. [Nested Persists](#nested-persists)
3. [Hot Module Replacement](./docs/hot-module-replacement.md)
4. Code Splitting [coming soon]

#### Basic Usage

> For a working reference implementation, see the [redux-persist-test-app](https://github.com/mdemichele/redux-persist-test-app) example app.

There are two required steps:

1. Wrap your root reducer with `persistReducer` and a configuration object.
2. Call `persistStore` on the resulting store.

```js
// configureStore.js

import { createStore } from 'redux'
import { persistStore, persistReducer } from '@mdemichele/redux-persist'
import storage from '@mdemichele/redux-persist/lib/storage' // defaults to localStorage for web

import rootReducer from './reducers'

const persistConfig = {
  key: 'root',     // the key used to store state in storage
  storage,         // the storage engine to use
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export default () => {
  let store = createStore(persistedReducer)
  let persistor = persistStore(store)
  return { store, persistor }
}
```

**`persistConfig`** requires two fields at minimum:
- `key` — the storage key under which the entire persisted state is stored. Using `'root'` is conventional for top-level persistence.
- `storage` — the storage engine. The default import (`@mdemichele/redux-persist/lib/storage`) uses `localStorage` on web. See [Storage Engines](#storage-engines) for other options.

**`persistReducer(config, reducer)`** returns an enhanced reducer that handles the `PERSIST`, `REHYDRATE`, and `PURGE` actions automatically. Swap it in place of your original root reducer — no other changes to your reducer logic are needed.

**`persistStore(store)`** returns a `Persistor` object that drives the persistence lifecycle. It immediately begins reading from storage and dispatches a `REHYDRATE` action once the stored state is loaded. The `Persistor` also exposes methods for pausing, resuming, flushing, and purging persistence — see the [API](#api) section for details.

> **Important:** Every app needs to choose how many levels of state to merge when rehydrated data is loaded back in. The default (`autoMergeLevel1`) performs a shallow one-level merge. Read through the [State Reconciler](#state-reconciler) section to choose the right option for your app.

**React: wrapping your app with `PersistGate`**

Because rehydration is asynchronous, your app may briefly render with default state before persisted data arrives. Wrap your root component with `PersistGate` to hold rendering until rehydration is complete.

```js
// App.js

import { PersistGate } from '@mdemichele/redux-persist/integration/react'
import { store, persistor } from './configureStore'

const App = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <RootComponent />
      </PersistGate>
    </Provider>
  );
};
```

- The `loading` prop is rendered while rehydration is in progress. Pass `null` to render nothing, or a loading component such as `loading={<LoadingScreen />}`.
- `PersistGate` also accepts a function as children: the function receives a single `bootstrapped` boolean argument and is re-invoked once persistence is complete, which is useful for adding transition animations.

## API

For the complete API reference see [docs/api.md](./docs/api.md).

#### `persistReducer(config, reducer)`

Wraps a reducer so that it automatically persists and rehydrates state.

- **`config`** *object* — required fields: `key`, `storage`. See the full config options below.
- **`reducer`** *function* — any reducer, typically the root reducer returned by `combineReducers`.
- Returns an enhanced reducer. Swap this in place of your original reducer when calling `createStore`.

**`persistConfig` options:**

| Option | Type | Default | Description |
|---|---|---|---|
| `key` | `string` | — | **Required.** The key used to store state in the storage engine. |
| `storage` | `object` | — | **Required.** The storage engine (see [Storage Engines](#storage-engines)). |
| `version` | `number` | `-1` | Integer version of your state shape. Used with `createMigrate` to run migrations. |
| `whitelist` | `string[]` | — | Only these reducer keys will be persisted. All others are ignored. |
| `blacklist` | `string[]` | — | These reducer keys will not be persisted. All others are saved. |
| `transforms` | `Transform[]` | — | Functions to transform state before writing to or after reading from storage. |
| `throttle` | `number` | — | Milliseconds to throttle write calls to the storage engine. |
| `migrate` | `function` | — | Custom migration function. Receives stored state and returns a promise of new state. |
| `stateReconciler` | `function \| false` | `autoMergeLevel1` | Controls how rehydrated state is merged. Pass `false` to disable reconciliation. |
| `serialize` | `boolean` | `true` | Set to `false` to skip `JSON.stringify`/`JSON.parse` during storage operations. |
| `timeout` | `number` | `5000` | Milliseconds to wait for storage to resolve before aborting. Useful for React Native. |
| `debug` | `boolean` | `false` | Set to `true` to enable verbose logging. |
| `writeFailHandler` | `function` | — | Called with the error if the storage engine fails during `setItem`. Useful for detecting quota exhaustion. |

#### `persistStore(store, [config, callback])`

Begins the persistence lifecycle and returns a `Persistor`.

- **`store`** *redux store* — the store returned by `createStore` with your `persistedReducer`.
- **`config`** *object* *(optional)*
  - `manualPersist: true` — prevents persistence from starting automatically. Call `persistor.persist()` manually when your storage is ready. Useful when the storage engine is not available at startup (e.g. on certain React Native environments).
- **`callback`** *function* *(optional)* — called once the initial rehydration is complete.
- Returns a **Persistor** object.

#### `persistor` object

The `Persistor` is a small Redux store that drives the persistence lifecycle. It exposes the following methods:

- **`.persist()`** — starts or resumes persistence. Called automatically unless `manualPersist` is set.
- **`.pause()`** — pauses persistence. State changes will not be written to storage while paused.
- **`.flush()`** — immediately writes all pending state to storage and returns a promise. Useful before app close or logout.
- **`.purge()`** — removes all persisted state from storage and returns a promise. Note: this only clears storage — it does not reset the in-memory Redux state.

## State Reconciler

When your app loads, redux-persist reads the previously saved state from storage and merges it back into the Redux store. A **state reconciler** is the function that controls exactly how that merge happens — specifically, how the rehydrated (stored) state is combined with the reducer's current initial state.

This matters because your reducer's initial state may have changed since the last time the user ran the app (e.g. you added a new field). The reconciler decides whether to keep the stored value, use the new initial value, or merge the two.

There are three reconcilers available out of the box:

---

**1. `autoMergeLevel1`** *(default)*

```js
// No import needed — this is the default behavior
```

Performs a shallow merge one level deep. For each top-level key in the stored state:
- If the reducer has already modified that key during the `REHYDRATE` action, the stored value is skipped (the reducer's value wins).
- Otherwise, the stored value overwrites the initial state value.

Keys that exist in initial state but not in stored state are preserved.

```
incoming state:   { foo: incomingFoo }
initial state:    { foo: initialFoo, bar: initialBar }
reconciled state: { foo: incomingFoo, bar: initialBar }
```

**Best for:** Most apps. Safe default that preserves new reducer keys while restoring previously saved values.

---

**2. `autoMergeLevel2`**

```js
import autoMergeLevel2 from '@mdemichele/redux-persist/lib/stateReconciler/autoMergeLevel2'
```

Behaves like `autoMergeLevel1` but goes one level deeper: if a top-level key holds a plain object, the stored and initial values for that object are themselves shallow-merged rather than the stored value simply overwriting the initial.

```
incoming state:   { foo: { a: 1 } }
initial state:    { foo: { a: 0, b: 2 }, bar: initialBar }
reconciled state: { foo: { a: 1, b: 2 }, bar: initialBar }
```

**Best for:** Apps where top-level state keys hold objects with multiple sub-fields, and you want new sub-fields from the reducer's initial state to survive rehydration.

---

**3. `hardSet`**

```js
import hardSet from '@mdemichele/redux-persist/lib/stateReconciler/hardSet'
```

Replaces state entirely with the stored (inbound) state. No merging occurs. Keys that exist in the initial state but not in stored state are dropped.

```
incoming state:   { foo: incomingFoo }
initial state:    { foo: initialFoo, bar: initialBar }
reconciled state: { foo: incomingFoo }    // bar is dropped
```

**Best for:** Nested `persistReducer` configurations, or reducers that do not rely on `initialState` at all. Use with caution at the root level — new state keys added to your reducer will be missing until the user clears storage.

---

**Configuring a reconciler:**

```js
import autoMergeLevel2 from '@mdemichele/redux-persist/lib/stateReconciler/autoMergeLevel2'

const persistConfig = {
  key: 'root',
  storage,
  stateReconciler: autoMergeLevel2,
}
```

Pass `stateReconciler: false` to disable reconciliation entirely — the stored state will be returned as-is with no merging.

## React Integration

See the [Basic Usage](#basic-usage) section above for a full walkthrough of `PersistGate`. In summary, `PersistGate` delays rendering your app until rehydration is complete, and supports two modes:

1. **`loading` prop** — renders the provided value (or `null`) while rehydration is in progress, then renders children.
2. **Function children** — passes a `bootstrapped` boolean to a render function, giving you control over transitions and animations.

```js
// Mode 1: loading prop
<PersistGate loading={<LoadingScreen />} persistor={persistor}>
  <RootComponent />
</PersistGate>

// Mode 2: function children
<PersistGate persistor={persistor}>
  {(bootstrapped) => bootstrapped ? <RootComponent /> : <LoadingScreen />}
</PersistGate>
```

## Blacklist & Whitelist

By default, redux-persist saves every key in your root reducer. Use `blacklist` or `whitelist` in your `persistConfig` to control which slices of state are persisted.

- **`blacklist`** — persist everything *except* the listed keys.
- **`whitelist`** — persist *only* the listed keys.

```js
// Persist everything except ‘navigation’
const persistConfig = {
  key: ‘root’,
  storage,
  blacklist: [‘navigation’],
};

// Persist only ‘auth’ and ‘userPreferences’
const persistConfig = {
  key: ‘root’,
  storage,
  whitelist: [‘auth’, ‘userPreferences’],
};
```

> **Note:** `blacklist` and `whitelist` only filter at the top level of your state tree. To filter keys nested deeper than one level, use [Nested Persists](#nested-persists).

## Nested Persists

Nesting a `persistReducer` inside another `persistReducer` gives you independent persistence configuration for different parts of your state tree. Common use cases include:

- **Deep filtering** — `blacklist`/`whitelist` only work one level deep, but a nested persist lets you exclude specific sub-keys.
- **Different storage engines** — persist sensitive data (e.g. auth tokens) to a secure store while keeping the rest in `localStorage`.
- **Code splitting** — configure persistence independently for lazily loaded reducers.

In the example below, the root config excludes the entire `auth` slice from its own persistence, and a separate config for `auth` handles its own persistence — excluding just the `somethingTemporary` sub-key.

```js
import { combineReducers } from ‘redux’
import { persistReducer } from ‘@mdemichele/redux-persist’
import storage from ‘@mdemichele/redux-persist/lib/storage’

import { authReducer, otherReducer } from ‘./reducers’

const rootPersistConfig = {
  key: ‘root’,
  storage,
  blacklist: [‘auth’], // auth is excluded here — it manages its own persistence below
}

const authPersistConfig = {
  key: ‘auth’,
  storage,
  blacklist: [‘somethingTemporary’], // only this sub-key is excluded from auth persistence
}

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  other: otherReducer,
})

export default persistReducer(rootPersistConfig, rootReducer)
```

## Migrations

As your app evolves, the shape of your Redux state may change — you might rename a key, remove a field, or restructure a slice entirely. Users who already have data persisted under the old shape need a migration path so their stored state remains valid.

`persistReducer` accepts a `migrate` config option — a function that receives the stored state and the current version number, and returns a promise resolving to the migrated state. It runs after reading from storage but before state reconciliation.

Redux Persist ships with `createMigrate` to help write these migrations in a structured way:

```js
import { createMigrate } from ‘@mdemichele/redux-persist’

const migrations = {
  0: (state) => {
    // version 0: initial shape, no migration needed
    return state
  },
  1: (state) => {
    // version 1: ‘userInfo’ was renamed to ‘user’
    return {
      ...state,
      user: state.userInfo,
      userInfo: undefined,
    }
  },
}

const persistConfig = {
  key: ‘root’,
  storage,
  version: 1,
  migrate: createMigrate(migrations, { debug: false }),
}
```

`createMigrate` runs all migrations between the stored version and the current `version` number in sequence. For more advanced usage (async migrations, error handling), pass your own function to `migrate` directly.

For further details see [docs/migrations.md](./docs/migrations.md).

## Transforms

Transforms let you intercept and modify state as it is written to storage (inbound) or read back from storage (outbound). This is useful when your state contains values that do not serialize cleanly to JSON — such as `Set`, `Map`, `Date`, class instances, or Immutable.js structures.

`createTransform` takes three arguments:
1. **Inbound function** — called before state is serialized and written to storage. Receives `(subState, key)`.
2. **Outbound function** — called after state is read from storage, before it is rehydrated into the store. Receives `(subState, key)`.
3. **Config object** — use `whitelist` or `blacklist` to limit which reducer keys the transform applies to. Without this, the transform runs for every persisted key.

**Example: persisting a `Set`**

`JSON.stringify` converts a `Set` to an empty object `{}`, losing all data. This transform converts it to an array for storage and back to a `Set` on rehydration:

```js
import { createTransform } from ‘@mdemichele/redux-persist’

const SetTransform = createTransform(
  (inboundState, key) => ({
    ...inboundState,
    mySet: [...inboundState.mySet], // Set → Array before storage
  }),
  (outboundState, key) => ({
    ...outboundState,
    mySet: new Set(outboundState.mySet), // Array → Set after rehydration
  }),
  { whitelist: [‘someReducer’] }
)

export default SetTransform
```

Register transforms in your `persistConfig`:

```js
import storage from ‘@mdemichele/redux-persist/lib/storage’
import { SetTransform } from ‘./transforms’

const persistConfig = {
  key: ‘root’,
  storage,
  transforms: [SetTransform],
}
```

Multiple transforms can be provided — they are applied in array order on the way in, and in reverse order on the way out.

**Community transform libraries:**

| Library | Description |
|---|---|
| [redux-persist-transform-immutable](https://github.com/rt2zz/redux-persist-transform-immutable) | Support Immutable.js reducers |
| [redux-persist-seamless-immutable](https://github.com/hilkeheremans/redux-persist-seamless-immutable) | Support seamless-immutable reducers |
| [redux-persist-transform-compress](https://github.com/rt2zz/redux-persist-transform-compress) | Compress serialized state with lz-string |
| [redux-persist-transform-encrypt](https://github.com/maxdeviant/redux-persist-transform-encrypt) | Encrypt serialized state with AES |
| [redux-persist-transform-filter](https://github.com/edy/redux-persist-transform-filter) | Persist or rehydrate a subset of state |
| [redux-persist-transform-filter-immutable](https://github.com/actra-development/redux-persist-transform-filter-immutable) | Subset filtering with Immutable.js support |
| [redux-persist-transform-expire](https://github.com/gabceb/redux-persist-transform-expire) | Expire state subsets based on a property |
| [redux-persist-expire](https://github.com/kamranahmedse/redux-persist-expire) | More flexible expiry with additional options |

## Storage Engines

redux-persist ships with two built-in storage engines for web:

```js
import storage from ‘@mdemichele/redux-persist/lib/storage’         // localStorage (default for web)
import storageSession from ‘@mdemichele/redux-persist/lib/storage/session’ // sessionStorage
```

`sessionStorage` behaves like `localStorage` but is cleared when the browser tab is closed — useful for session-scoped state that should not survive past the current session.

**Writing a custom storage engine:**

Any object that implements the following async interface can be used as a storage engine:

```js
const customStorage = {
  getItem: (key) => Promise<string | null>,
  setItem: (key, value) => Promise<void>,
  removeItem: (key) => Promise<void>,
}
```

**Community storage engines:**

| Engine | Environment | Description | Status |
|---|---|---|---|
| [@react-native-async-storage/async-storage](https://github.com/react-native-async-storage/async-storage) | React Native | Official community AsyncStorage — works directly as a storage engine | Active |
| [react-native-mmkv](https://github.com/mrousavy/react-native-mmkv) | React Native | High-performance key-value storage — requires a [thin custom adapter](https://github.com/mrousavy/react-native-mmkv#redux-persist) | Active |
| [redux-persist-expo-filesystem](https://github.com/t73liu/redux-persist-expo-filesystem) | React Native (Expo) | Filesystem storage — no linking or ejecting required | Active |
| [redux-persist-expo-securestore](https://github.com/Cretezy/redux-persist-expo-securestore) | React Native (Expo) | Expo SecureStore for sensitive data | Active |
| [redux-persist-filesystem-storage](https://github.com/robwalkerco/redux-persist-filesystem-storage) | React Native (Android) | Mitigates Android storage size limitations | Active |
| [redux-persist-webextension-storage](https://github.com/ssorallen/redux-persist-webextension-storage) | Chrome / Firefox | Browser extension storage API | Unmaintained |
| [redux-persist-cookie-storage](https://github.com/abersager/redux-persist-cookie-storage) | Web / Node.js | Cookie-based storage, works universally | Unmaintained |
| [redux-persist-indexeddb-storage](https://github.com/machester4/redux-persist-indexeddb-storage) | Web | IndexedDB via localForage — recommended for large state | Unmaintained |
| [redux-persist-node-storage](https://github.com/pellejacobs/redux-persist-node-storage) | Node.js | File-based storage for Node environments | Unmaintained |
| [redux-persist-pouchdb](https://github.com/yanick/redux-persist-pouchdb) | Web / Node.js | PouchDB storage engine | Unmaintained |
| [redux-persist-fs-storage](https://github.com/leethree/redux-persist-fs-storage) | React Native | react-native-fs engine | Unmaintained |
| [redux-persist-weapp-storage](https://github.com/cuijiemmx/redux-casa/tree/master/packages/redux-persist-weapp-storage) | WeChat Mini Program | Compatible with wepy | Unmaintained |
| [redux-persist-sensitive-storage](https://github.com/CodingZeal/redux-persist-sensitive-storage) | React Native | Sensitive data via react-native-sensitive-info | Archived |
| [@bankify/redux-persist-realm](https://github.com/bankifyio/redux-persist-realm) | React Native | Realm database (requires Realm installation) | Archived |


## Community & Contributing

Contributions are welcome. If you have an outstanding pull request from the original `redux-persist` repository, please open a new PR here and reference the original — we will review it and work with you to get it integrated. As the codebase has moved to TypeScript, some changes may be needed, but we are happy to help with that.

To report a bug or request a feature, please [open an issue](https://github.com/mdemichele/redux-persist/issues).

To submit a contribution:
1. Fork the repository and create a branch for your change.
2. Run the test suite with `npm test` before submitting.
3. Open a pull request with a clear description of what the change does and why.
