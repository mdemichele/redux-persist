import { useState, useEffect, useSyncExternalStore, ReactNode } from 'react'
import type { Persistor } from '../types'

type Props = {
  onBeforeLift?: () => void,
  children: ReactNode | ((state: boolean) => ReactNode),
  loading?: ReactNode,
  persistor: Persistor,
}

export function PersistGate({ persistor, onBeforeLift, children, loading = null }: Props) {
  const bootstrapped = useSyncExternalStore(
    persistor.subscribe,
    () => persistor.getState().bootstrapped
  )

  // If already bootstrapped on mount with no onBeforeLift, skip the loading flash
  const [bootstrappedAndLifted, setBootstrappedAndLifted] = useState(
    () => bootstrapped && !onBeforeLift
  )

  useEffect(() => {
    if (bootstrapped) {
      if (onBeforeLift) {
        Promise.resolve(onBeforeLift()).finally(() => setBootstrappedAndLifted(true))
      } else {
        setBootstrappedAndLifted(true)
      }
    }
  }, [bootstrapped]) // eslint-disable-line react-hooks/exhaustive-deps

  if (process.env.NODE_ENV !== 'production') {
    if (typeof children === 'function' && loading)
      console.error(
        'redux-persist: PersistGate expects either a function child or loading prop, but not both. The loading prop will be ignored.'
      )
  }

  if (typeof children === 'function') {
    return children(bootstrappedAndLifted)
  }

  return bootstrappedAndLifted ? children : loading
}
