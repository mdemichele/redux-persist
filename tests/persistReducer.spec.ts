import test from 'ava'
import sinon from 'sinon'

import persistReducer from '../src/persistReducer'
import createMemoryStorage from './utils/createMemoryStorage'
import { PERSIST, REHYDRATE } from '../src/constants'
import sleep from './utils/sleep'

const reducer = () => ({})
const config = {
  key: 'persist-reducer-test',
  version: 1,
  storage: createMemoryStorage()
}

test('persistedReducer does not automatically set _persist state', t => {
  const persistedReducer = persistReducer(config, reducer)
  const state = persistedReducer({}, {type: "UNDEFINED"})
  console.log('state', state)
  t.is(undefined, state._persist)
})

test('persistedReducer does returns versioned, rehydrate tracked _persist state upon PERSIST', t => {
  const persistedReducer = persistReducer(config, reducer)
  const register = sinon.spy()
  const rehydrate = sinon.spy()
  const state = persistedReducer({}, { type: PERSIST, register, rehydrate })
  t.deepEqual({ version: 1, rehydrated: false}, state._persist)
})

test('persistedReducer calls register and rehydrate after PERSIST', async (t) => {
  const persistedReducer = persistReducer(config, reducer)
  const register = sinon.spy()
  const rehydrate = sinon.spy()
  persistedReducer({}, { type: PERSIST, register, rehydrate })
  await sleep(5000)
  t.is(register.callCount, 1)
  t.is(rehydrate.callCount, 1)
})

test('persistedReducer rehydrates immediately when storage is empty', async (t) => {
  const persistedReducer = persistReducer(config, reducer)
  const register = sinon.spy()
  const rehydrate = sinon.spy()
  persistedReducer({}, { type: PERSIST, register, rehydrate })
  await sleep(50)
  t.is(rehydrate.callCount, 1)
})

test('persistedReducer warns in dev when nested _persist is detected in state', (t) => {
  const consoleError = sinon.stub(console, 'error')
  const persistedReducer = persistReducer(config, reducer)
  const stateWithNestedPersist = {
    nested: { _persist: { version: 1, rehydrated: true }, value: 'foo' },
  }
  persistedReducer(stateWithNestedPersist as any, { type: 'SOME_ACTION' })
  t.true(
    consoleError.calledWithMatch(/nested _persist detected/)
  )
  consoleError.restore()
})

test('persistedReducer warns only once for nested _persist', (t) => {
  const consoleError = sinon.stub(console, 'error')
  const persistedReducer = persistReducer(config, reducer)
  const stateWithNestedPersist = {
    nested: { _persist: { version: 1, rehydrated: true }, value: 'foo' },
  }
  persistedReducer(stateWithNestedPersist as any, { type: 'ACTION_ONE' })
  persistedReducer(stateWithNestedPersist as any, { type: 'ACTION_TWO' })
  t.is(consoleError.callCount, 1)
  consoleError.restore()
})

test('persistedReducer warns in dev when action fires before rehydration completes', (t) => {
  const consoleWarn = sinon.stub(console, 'warn')
  const persistedReducer = persistReducer(config, reducer)
  const stateWithUnrehydratedPersist = {
    _persist: { version: 1, rehydrated: false },
  }
  persistedReducer(stateWithUnrehydratedPersist as any, { type: 'SOME_ACTION' })
  t.true(
    consoleWarn.calledWithMatch(/was dispatched for key.*before rehydration completed/)
  )
  consoleWarn.restore()
})

test('persistedReducer does not warn when action fires after rehydration completes', (t) => {
  const consoleWarn = sinon.stub(console, 'warn')
  const persistedReducer = persistReducer(config, reducer)
  const rehydratedState = {
    _persist: { version: 1, rehydrated: true },
  }
  persistedReducer(rehydratedState as any, { type: 'SOME_ACTION' })
  t.false(consoleWarn.called)
  consoleWarn.restore()
})
