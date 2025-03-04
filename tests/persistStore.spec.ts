import test from 'ava'
import sinon from 'sinon'

import configureStore, { MockStoreCreator, MockStoreEnhanced } from 'redux-mock-store' // @TODO: Redux Mock Store is deprecated. Should update soon.

import persistStore from '../src/persistStore'
import { PERSIST, REHYDRATE } from '../src/constants'
import find from './utils/find'
import { Middleware } from 'redux'
import { Persistor } from '../src/types'

const middleware: Middleware[] = []
const mockStore: MockStoreCreator<unknown, {}> = configureStore(middleware)

test('persistStore returns a Persistor object', t => {
  const store: MockStoreEnhanced<unknown, {}> = mockStore()
  const persistor: Persistor = persistStore(store)
  t.is('object', typeof persistor)
  t.is('function', typeof persistor.pause)
  t.is('function', typeof persistor.persist)
  t.is('function', typeof persistor.purge)
  t.is('function', typeof persistor.flush)
  t.is('function', typeof persistor.dispatch)
  t.is('function', typeof persistor.getState)
  t.is('function', typeof persistor.subscribe)
})

test('persistStore dispatches PERSIST action', t => {
  const store: MockStoreEnhanced<unknown, {}> = mockStore()
  persistStore(store)
  const actions = store.getActions()
  const persistAction = find(actions, { type: PERSIST })
  t.truthy(persistAction)
  t.is('persist/PERSIST', persistAction.type)
})

test('register method adds a key to the registry', t => {
  const store = mockStore()
  const persistor = persistStore(store)
  const actions = store.getActions()
  const persistAction = find(actions, { type: PERSIST })
  persistAction.register('canary')
  t.deepEqual(persistor.getState().registry, ['canary'])
})

test('rehydrate method fires with the expected shape', t => {
  const store = mockStore()
  persistStore(store)
  const actions = store.getActions()
  const persistAction = find(actions, { type: PERSIST })
  persistAction.rehydrate('canary', { foo: 'bar' }, null)
  const rehydrateAction = find(actions, { type: REHYDRATE })
  t.deepEqual(rehydrateAction, { type: REHYDRATE, key: 'canary', payload: { foo: 'bar' }, err: null })
})

test('rehydrate method removes provided key from registry', t => {
  const store = mockStore()
  const persistor = persistStore(store)
  const actions = store.getActions()
  const persistAction = find(actions, { type: PERSIST })

  // register canary
  persistAction.register('canary')
  t.deepEqual(persistor.getState().registry, ['canary'])

  // rehydrate canary
  persistAction.rehydrate('canary', { foo: 'bar' }, null)
  t.deepEqual(persistor.getState().registry, [])
})

test('rehydrate method removes exactly one of provided key from registry', t => {
  const store = mockStore()
  const persistor = persistStore(store)
  const actions = store.getActions()
  const persistAction = find(actions, { type: PERSIST })

  // register canary twice
  persistAction.register('canary')
  persistAction.register('canary')
  t.deepEqual(persistor.getState().registry, ['canary', 'canary'])

  // rehydrate canary
  persistAction.rehydrate('canary', { foo: 'bar' }, null)
  t.deepEqual(persistor.getState().registry, ['canary'])
})

test('once registry is cleared for first time, persistor is flagged as bootstrapped', t => {
  const store = mockStore()
  const persistor = persistStore(store)
  const actions = store.getActions()
  const persistAction = find(actions, { type: PERSIST })

  persistAction.register('canary')
  t.false(persistor.getState().bootstrapped)
  persistAction.rehydrate('canary', { foo: 'bar' }, null)
  t.true(persistor.getState().bootstrapped)
})

test('once persistor is flagged as bootstrapped, further registry changes do not affect this value', t => {
  const store = mockStore()
  const persistor = persistStore(store)
  const actions = store.getActions()
  const persistAction = find(actions, { type: PERSIST })

  persistAction.register('canary')
  t.false(persistor.getState().bootstrapped)
  persistAction.rehydrate('canary', { foo: 'bar' }, null)
  t.true(persistor.getState().bootstrapped)

  // add canary back, registry is updated but bootstrapped remains true
  persistAction.register('canary')
  t.deepEqual(persistor.getState().registry, ['canary'])
  t.true(persistor.getState().bootstrapped)
})

test('persistStore calls bootstrapped callback (at most once) if provided', t => {
  const store = mockStore()
  const bootstrappedCb = sinon.spy()  
  persistStore(store, {}, bootstrappedCb)
  const actions = store.getActions()
  const persistAction = find(actions, { type: PERSIST })
  
  persistAction.register('canary')
  persistAction.rehydrate('canary', { foo: 'bar' }, null)
  t.is(bootstrappedCb.callCount, 1)

  // further rehydrates do not trigger the cb
  persistAction.register('canary')
  persistAction.rehydrate('canary', { foo: 'bar' }, null)
  t.is(bootstrappedCb.callCount, 1)
})
