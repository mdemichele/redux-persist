# Project Purpose

## What Does redux-persist Do?

redux-persist saves your Redux store to persistent storage (such as `localStorage` in a browser or `AsyncStorage` in React Native) and restores it when the application reloads. The two core operations are:

- **Persist** — serialize and write Redux state to a storage engine after each change.
- **Rehydrate** — read that serialized state back from storage on startup and merge it into the Redux store before the UI renders.

The library wraps your existing reducer with `persistReducer` and creates a companion `Persistor` object via `persistStore`. From that point on, persistence is automatic — you configure it once and the library handles the read/write cycle on your behalf.

## Why Was redux-persist Created?

Redux gives you a predictable, centralized state container, but that state lives entirely in memory. Every time a user refreshes the page, closes the tab, or restarts a mobile app, the store resets to its initial values. For most real-world applications this is a poor user experience: shopping carts empty themselves, authentication tokens disappear, user preferences reset, and partially completed workflows are lost.

Solving this by hand is repetitive and error-prone. You must choose a storage medium, decide which parts of state to save, serialize and deserialize on every change, handle storage errors, manage schema migrations as your state shape evolves, and coordinate the timing of the initial render so the UI does not flash stale defaults before persisted data arrives. redux-persist handles all of that in a composable, storage-agnostic way.

## The Fundamental Problem It Solves

**Redux state is ephemeral; user expectations are not.**

Users expect applications to remember things — their session, their settings, their progress. redux-persist bridges the gap between Redux's in-memory model and the durable storage available on every platform. It does this without requiring changes to your existing reducers or actions: you wrap the reducer, call `persistStore`, and opt individual slices of state in or out via a whitelist or blacklist.

The library also addresses the subtler problems that arise once persistence is in place:

- **State shape migrations** — as your application evolves, old persisted state may no longer match your current reducer shape. The `createMigrate` helper lets you write versioned migration functions so users are never stuck with incompatible stored data.
- **Selective persistence** — not everything should be saved. Transient UI state, loading flags, and ephemeral session data should reset on reload. Whitelists and blacklists give you precise control over what gets written to storage.
- **Render timing** — rehydration is asynchronous. The `PersistGate` React component delays rendering until the stored state has been loaded, preventing a flash of default state that would otherwise confuse users or trigger unintended side effects.
- **Pluggable storage** — the same library works across web (`localStorage`, `sessionStorage`, IndexedDB), React Native (`AsyncStorage`), Node.js, browser extensions, and any custom backend that implements a simple `getItem`/`setItem`/`removeItem` interface.
