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
