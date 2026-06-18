# Redux Persist
Persist and rehydrate a redux store.

[![npm version](https://img.shields.io/npm/v/@mdemichele/redux-persist.svg?style=flat-square)](https://www.npmjs.com/package/@mdemichele/redux-persist) [![npm downloads](https://img.shields.io/npm/dm/@mdemichele/redux-persist.svg?style=flat-square)](https://www.npmjs.com/package/@mdemichele/redux-persist)

## Overview

Redux state lives entirely in memory and resets on every page refresh or app restart. redux-persist solves this by automatically saving your Redux store to a storage engine (such as `localStorage` on web or `AsyncStorage` on React Native) and restoring it when the application reloads — with no changes required to your existing reducers or actions.

Beyond basic persistence, the library also handles state shape migrations as your app evolves, lets you choose exactly which slices of state to save via whitelists and blacklists, and provides a `PersistGate` React component to delay rendering until rehydration is complete.

For a deeper look at the problem this project solves and why it was built, see [docs/project-purpose.md](./docs/project-purpose.md).

> **Note on versioning:** The initial `v0.0.1` npm release was a proof-of-concept publish to establish the `@mdemichele/redux-persist` package name. The next release will be `v6.1.0`, aligning with the actual version of the codebase (the TypeScript fork) and providing a meaningful starting point for future semantic versioning.

## Project Timeline

- June 9, 2026: v0.0.1 released to npm as `@mdemichele/redux-persist`
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
State reconcilers define how incoming state is merged in with initial state. It is critical to choose the right state reconciler for your state. There are three options that ship out of the box, let's look at how each operates:

1. **hardSet** (`import hardSet from '@mdemichele/redux-persist/lib/stateReconciler/hardSet'`)
This will hard set incoming state. This can be desirable in some cases where persistReducer is nested deeper in your reducer tree, or if you do not rely on initialState in your reducer.
   - **incoming state**: `{ foo: incomingFoo }`
   - **initial state**: `{ foo: initialFoo, bar: initialBar }`
   - **reconciled state**: `{ foo: incomingFoo }` // note bar has been dropped
2. **autoMergeLevel1** (default)
This will auto merge one level deep. Auto merge means if the some piece of substate was modified by your reducer during the REHYDRATE action, it will skip this piece of state. Level 1 means it will shallow merge 1 level deep.
   - **incoming state**: `{ foo: incomingFoo }`
   - **initial state**: `{ foo: initialFoo, bar: initialBar }`
   - **reconciled state**: `{ foo: incomingFoo, bar: initialBar }` // note incomingFoo overwrites initialFoo
3. **autoMergeLevel2** (`import autoMergeLevel2 from '@mdemichele/redux-persist/lib/stateReconciler/autoMergeLevel2'`)
This acts just like autoMergeLevel1, except it shallow merges two levels
   - **incoming state**: `{ foo: incomingFoo }`
   - **initial state**: `{ foo: initialFoo, bar: initialBar }`
   - **reconciled state**: `{ foo: mergedFoo, bar: initialBar }` // note: initialFoo and incomingFoo are shallow merged

#### Example
```js
import hardSet from '@mdemichele/redux-persist/lib/stateReconciler/hardSet'

const persistConfig = {
  key: 'root',
  storage,
  stateReconciler: hardSet,
}
```

## React Integration
Redux persist ships with react integration as a convenience. The `PersistGate` component is the recommended way to delay rendering until persistence is complete. It works in one of two modes:
1. `loading` prop: The provided loading value will be rendered until persistence is complete at which point children will be rendered.
2. function children: The function will be invoked with a single `bootstrapped` argument. When bootstrapped is true, persistence is complete and it is safe to render the full app. This can be useful for adding transition animations.

## Blacklist & Whitelist
By Example:
```js
// BLACKLIST
const persistConfig = {
  key: 'root',
  storage: storage,
  blacklist: ['navigation'] // navigation will not be persisted
};

// WHITELIST
const persistConfig = {
  key: 'root',
  storage: storage,
  whitelist: ['navigation'] // only navigation will be persisted
};
```

## Nested Persists
Nested persist can be useful for including different storage adapters, code splitting, or deep filtering. For example while blacklist and whitelist only work one level deep, but we can use a nested persist to blacklist a deeper value:
```js
import { combineReducers } from 'redux'
import { persistReducer } from '@mdemichele/redux-persist'
import storage from '@mdemichele/redux-persist/lib/storage'

import { authReducer, otherReducer } from './reducers'

const rootPersistConfig = {
  key: 'root',
  storage: storage,
  blacklist: ['auth']
}

const authPersistConfig = {
  key: 'auth',
  storage: storage,
  blacklist: ['somethingTemporary']
}

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  other: otherReducer,
})

export default persistReducer(rootPersistConfig, rootReducer)
```

## Migrations
`persistReducer` has a general purpose "migrate" config which will be called after getting stored state but before actually reconciling with the reducer. It can be any function which takes state as an argument and returns a promise to return a new state object.

Redux Persist ships with `createMigrate`, which helps create a synchronous migration for moving from any version of stored state to the current state version. [[Additional information]](./docs/migrations.md)

## Transforms
Transforms allow you to customize the state object that gets persisted and rehydrated.

There are several libraries that tackle some common implementations for transforms.
- [immutable](https://github.com/rt2zz/redux-persist-transform-immutable) - support immutable reducers
- [seamless-immutable](https://github.com/hilkeheremans/redux-persist-seamless-immutable) - support seamless-immutable reducers
- [compress](https://github.com/rt2zz/redux-persist-transform-compress) - compress your serialized state with lz-string
- [encrypt](https://github.com/maxdeviant/redux-persist-transform-encrypt) - encrypt your serialized state with AES
- [filter](https://github.com/edy/redux-persist-transform-filter) - store or load a subset of your state
- [filter-immutable](https://github.com/actra-development/redux-persist-transform-filter-immutable) - store or load a subset of your state with support for immutablejs
- [expire](https://github.com/gabceb/redux-persist-transform-expire) - expire a specific subset of your state based on a property
- [expire-reducer](https://github.com/kamranahmedse/redux-persist-expire) - more flexible alternative to expire transformer above with more options

When the state object gets persisted, it first gets serialized with `JSON.stringify()`. If parts of your state object are not mappable to JSON objects, the serialization process may transform these parts of your state in unexpected ways. For example, the javascript [Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) type does not exist in JSON. When you try to serialize a Set via `JSON.stringify()`, it gets converted to an empty object. Probably not what you want.

Below is a Transform that successfully persists a Set property, which simply converts it to an array and back. In this way, the Set gets converted to an Array, which is a recognized data structure in JSON. When pulled out of the persisted store, the array gets converted back to a Set before being saved to the redux store.

```js
import { createTransform } from '@mdemichele/redux-persist';

const SetTransform = createTransform(
  // transform state on its way to being serialized and persisted.
  (inboundState, key) => {
    // convert mySet to an Array.
    return { ...inboundState, mySet: [...inboundState.mySet] };
  },
  // transform state being rehydrated
  (outboundState, key) => {
    // convert mySet back to a Set.
    return { ...outboundState, mySet: new Set(outboundState.mySet) };
  },
  // define which reducers this transform gets called for.
  { whitelist: ['someReducer'] }
);

export default SetTransform;
```

The `createTransform` function takes three parameters.
1. An "inbound" function that gets called right before state is persisted (optional).
2. An "outbound" function that gets called right before state is rehydrated (optional).
3. A config object that determines which keys in your state will be transformed (by default no keys are transformed).

In order to take effect transforms need to be added to a `PersistReducer`’s config object.

```
import storage from '@mdemichele/redux-persist/lib/storage'
import { SetTransform } from './transforms';

const persistConfig = {
  key: 'root',
  storage: storage,
  transforms: [SetTransform]
};
```

## Storage Engines
- **localStorage** `import storage from '@mdemichele/redux-persist/lib/storage'`
- **sessionStorage** `import storageSession from '@mdemichele/redux-persist/lib/storage/session'`
- **[electron storage](https://github.com/psperber/redux-persist-electron-storage)** Electron support via [electron store](https://github.com/sindresorhus/electron-store) - [DEPRECATED]
- **[redux-persist-cookie-storage](https://github.com/abersager/redux-persist-cookie-storage)** Cookie storage engine, works in browser and Node.js, for universal / isomorphic apps
- **[redux-persist-expo-filesystem](https://github.com/t73liu/redux-persist-expo-filesystem)** react-native, similar to redux-persist-filesystem-storage but does not require linking or ejecting CRNA/Expo app. Only available if using Expo SDK (Expo, create-react-native-app, standalone).
- **[redux-persist-expo-securestore](https://github.com/Cretezy/redux-persist-expo-securestore)** react-native, for sensitive information using Expo's SecureStore. Only available if using Expo SDK (Expo, create-react-native-app, standalone).
- **[redux-persist-fs-storage](https://github.com/leethree/redux-persist-fs-storage)** react-native-fs engine
- **[redux-persist-filesystem-storage](https://github.com/robwalkerco/redux-persist-filesystem-storage)** react-native, to mitigate storage size limitations in android ([#199](https://github.com/rt2zz/redux-persist/issues/199), [#284](https://github.com/rt2zz/redux-persist/issues/284))
  **[redux-persist-indexeddb-storage](https://github.com/machester4/redux-persist-indexeddb-storage)** recommended for web via [localForage](https://github.com/localForage/localForage)
- **[redux-persist-node-storage](https://github.com/pellejacobs/redux-persist-node-storage)** for use in nodejs environments.
- **[redux-persist-pouchdb](https://github.com/yanick/redux-persist-pouchdb)** Storage engine for PouchDB.
- **[redux-persist-sensitive-storage](https://github.com/CodingZeal/redux-persist-sensitive-storage)** react-native, for sensitive information (uses [react-native-sensitive-info](https://github.com/mCodex/react-native-sensitive-info)).
- **[redux-persist-weapp-storage](https://github.com/cuijiemmx/redux-casa/tree/master/packages/redux-persist-weapp-storage)** Storage engine for wechat mini program, also compatible with wepy
- **[redux-persist-webextension-storage](https://github.com/ssorallen/redux-persist-webextension-storage)** Storage engine for browser (Chrome, Firefox) web extension storage
- **[@bankify/redux-persist-realm](https://github.com/bankifyio/redux-persist-realm)** Storage engine for Realm database, you will need to install Realm first
- **custom** any conforming storage api implementing the following methods: `setItem` `getItem` `removeItem`. (**NB**: These methods must support promises)

## Community & Contributing

I will be updating this section shortly. If you have a pull request that you've got outstanding, please reach out and I will try to review it and get it integrated. As we've shifted to TypeScript, that may necessitate some changes, but I'm happy to help in that regard, wherever I can.
