`PersistGate` is a React component that delays the rendering of your app's UI until your persisted state has been retrieved and saved to redux. It acts as a "gate" around your application, allowing you to control when the "gate" will open and what to show users before the "gate" opens.

> **Requires React 18 or higher.** `PersistGate` uses `useSyncExternalStore`, which is a React 18 API. This makes it safe under React 18's concurrent renderer — the previous class-based implementation could cause UI tearing because it read from the persistor during render, which can produce stale snapshots in a concurrent render cycle.

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `persistor` | `Persistor` | Yes | The persistor instance returned by `persistStore`. `PersistGate` subscribes to this to know when bootstrapping is complete. |
| `loading` | `ReactNode` | No | A React element to render while the persisted state is loading (e.g. a splash screen). Defaults to `null`. |
| `children` | `ReactNode \| (bootstrapped: boolean) => ReactNode` | No | Your app's UI. Can also be a render function that receives a `bootstrapped` boolean, useful when you need to handle the loading state inline. Defaults to `null`. |
| `onBeforeLift` | `() => void \| Promise<void>` | No | A callback invoked just before the gate lifts (i.e. just before children are shown). Supports returning a `Promise` to delay lifting until async work completes. |

**NOTE**: When `children` is a render function, the `loading` prop is ignored. A dev-mode warning is emitted if both are provided.

## Example Usage

```js
import { PersistGate } from '@mdemichele/redux-persist/integration/react'
import { store, persistor } from './store/configureStore'

const onBeforeLift = () => {
  // take some action before the gate lifts
}

export default () => (
  <Provider store={store}>
    <PersistGate
      loading={<Loading />}
      onBeforeLift={onBeforeLift}
      persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>
)
```

## Function Children

Pass a function as `children` to receive the `bootstrapped` state directly. This is useful for adding transition animations or conditionally rendering different UI:

```js
<PersistGate persistor={persistor}>
  {(bootstrapped) => bootstrapped ? <App /> : <LoadingScreen />}
</PersistGate>
```

## SSR and Next.js

`PersistGate` is safe to render server-side. The `useSyncExternalStore` server snapshot always returns `false`, meaning the server render always produces the `loading` state (or the render-function result for `bootstrapped = false`) and never attempts to access storage. Hydration on the client then picks up the real bootstrapped state.
