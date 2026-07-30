import test from 'ava'
import { createStore } from 'redux'

import getStoredState from '../src/getStoredState'
import persistReducer from '../src/persistReducer'
import persistStore from '../src/persistStore'
import createMemoryStorage from './utils/createMemoryStorage'

interface StateObject {
  [key: string]: any
}

const initialState: StateObject = { a: 0 }
const persistObj = {
  version: 1,
  rehydrated: true,
}

const reducer = (state = initialState, { type }: { type: any }) => {
  if (type === 'INCREMENT') {
    const result: StateObject = {}
    Object.keys(state).forEach(key => {
      result[key] = state[key] + 1
    })
    return result
  }
  return state
}

const memoryStorage = createMemoryStorage()

const config = {
  key: 'resync-reducer-test',
  version: 1,
  storage: memoryStorage,
  debug: true,
  throttle: 1000,
}

test('state is resynced from storage', t => {
  return new Promise((resolve) => {
    const rootReducer = persistReducer(config, reducer)
    const store = createStore(rootReducer)

    const persistor = persistStore(store, {}, async () => {
      // 1) Make sure redux-persist and storage are in the same state
      await persistor.flush()
      const storagePreModify = await getStoredState(config)

      const oldStorageState = {
        ...initialState,
        _persist: persistObj,
      }
      t.deepEqual(storagePreModify, oldStorageState)

      // 2) Change storage directly so redux-persist won't notice
      const newStorageValue = {
        a: 1,
        _persist: JSON.stringify(persistObj),
      }
      await memoryStorage.setItem(`persist:${config.key}`, JSON.stringify(newStorageValue))
      const storagePostModify = await getStoredState(config)

      // 3) Call resync and verify redux-persist state was overridden by storage
      await persistor.resync()
      t.deepEqual(storagePostModify, {
        a: 1,
        _persist: persistObj,
      })

      resolve(undefined)
    })
  })
})
