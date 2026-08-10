# Redux Principles

This document explains the core Redux concepts that underlie this project. It is intended for anyone who wants to contribute to redux-persist and needs a foundation in how Redux works.

---

## The Redux Store

A Redux store is an object that holds your entire application state tree. It has three core methods:

- `getState()` — returns the current state
- `dispatch(action)` — sends an action through the reducer to produce new state
- `subscribe(listener)` — registers a callback that fires whenever state changes

The store is created once via `createStore(reducer, initialState)`. Every time you call `dispatch`, Redux runs the action through your reducer function, which takes `(currentState, action)` and returns a new state object. The store replaces its internal state with the result and notifies all subscribers.

That is the complete core API — there is nothing else to a store beyond those three methods plus `replaceReducer` for advanced use cases.

---

## Reducers

A reducer is a pure function with the signature `(state, action) => newState`. It is the only place where state can change in a Redux app.

"Pure" means it has no side effects — given the same inputs it always returns the same output, and it never mutates `state` directly. Instead it returns a new object when something changes.

Every action dispatched to the store is passed through the reducer. The reducer inspects `action.type` and decides what (if anything) to change:

```js
function counterReducer(state = { count: 0 }, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1 }
    case 'DECREMENT':
      return { count: state.count - 1 }
    default:
      return state  // always return current state for unknown actions
  }
}
```

The `default` case is important — reducers must always return state, even when they don't recognize the action.

**Relevance to redux-persist:** `persistReducer` is a higher-order reducer — it wraps your existing reducer and intercepts the special `PERSIST`, `REHYDRATE`, `PURGE`, `FLUSH`, and `PAUSE` action types to manage persistence, then delegates all other actions to your original reducer.

---

## Actions

An action is a plain JavaScript object that describes something that happened. It is the only way to trigger a state change in Redux. Every action must have a `type` property — a string that identifies what occurred. Actions can also carry additional data in a `payload` field (or any other field name) that the reducer uses to compute the new state:

```js
// A simple action with just a type
{ type: 'INCREMENT' }

// An action carrying a payload
{ type: 'SET_USERNAME', payload: 'alice' }
```

Actions are created and dispatched via `store.dispatch(action)`. A common pattern is to use *action creator* functions to avoid repeating the object literal everywhere:

```js
const setUsername = (name) => ({ type: 'SET_USERNAME', payload: name })

store.dispatch(setUsername('alice'))
```

**Relevance to redux-persist:** redux-persist defines its own set of action types (all prefixed `persist/`) in `src/constants.ts`: `PERSIST`, `REHYDRATE`, `REGISTER`, `PURGE`, `FLUSH`, and `PAUSE`. These are dispatched internally by the library to coordinate the persistence lifecycle — you will encounter them throughout the source code.

---

## How persistStore Uses createStore

`persistStore` (`src/persistStore.ts`) creates its own internal Redux store using `createStore` to track the persistence lifecycle. This internal store — referred to as `_pStore` in the source — uses a simple `persistorReducer` that manages two pieces of state:

- `registry: string[]` — the keys of persisted reducers that have registered but not yet finished rehydrating
- `bootstrapped: boolean` — becomes `true` once every registered reducer has rehydrated (i.e., `registry` is empty)

The `Persistor` object returned to the caller spreads `_pStore` directly, so it exposes the standard Redux store API (`getState`, `dispatch`, `subscribe`) alongside the persistence-specific methods (`purge`, `flush`, `pause`, `persist`). When `PersistGate` checks `persistor.getState().bootstrapped` to decide whether to render the app, it is reading from this internal store.
