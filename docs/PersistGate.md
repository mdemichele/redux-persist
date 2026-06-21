`PersistGate` is a React component that delays the rendering of your app's UI until your persisted state has been retrieved and saved to redux. It acts as a "gate" around your application, allowing you to control when the "gate" will open and what to show users before the "gate" opens. 

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `persistor` | `Persistor` | Yes | The persistor instance returned by `persistStore`. `PersistGate` subscribes to this to know when bootstrapping is complete. |
| `loading` | `ReactNode` | No | A React element to render while the persisted state is loading (e.g. a splash screen). Defaults to `null`. |
| `children` | `ReactNode \| (bootstrapped: boolean) => ReactNode` | No | Your app's UI. Can also be a render function that receives a `bootstrapped` boolean, useful when you need to handle the loading state inline. Defaults to `null`. |
| `onBeforeLift` | `() => void` | No | A callback invoked just before the gate lifts (i.e. just before `bootstrapped` becomes `true`). Supports returning a `Promise` to delay lifting until async work completes. |

**NOTE**: the `loading` prop can be `null` or any react instance to show during loading (e.g. a splash screen), for example `loading={<Loading />}`.

Example usage:

```js
import { PersistGate } from 'redux-persist/es/integration/react'

import configureStore from './store/configureStore'

const { persistor, store } = configureStore()

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
