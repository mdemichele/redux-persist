import persistCombineReducers from '../src/persistCombineReducers'
import createMemoryStorage from './utils/createMemoryStorage'
import { PERSIST, REHYDRATE } from '../src/constants'

import test from 'ava'
import sinon from 'sinon'

const config = {
  key: 'TestConfig',
  storage: createMemoryStorage(),
}

test('persistCombineReducers returns a function', (t) => {
  const reducer = persistCombineReducers(config, {
    foo: () => ({}),
  })

  t.is(typeof reducer, 'function')
})

test('persistCombineReducers merges two levels deep of state', (t) => {
  const fooReducer = (state = { a: 'reducer_a', b: 'reducer_b' }) => state
  const barReducer = (state = { c: 'reducer_c', d: 'reducer_d' }) => state

  const reducer = persistCombineReducers(config, {
    foo: fooReducer,
    bar: barReducer,
  })

  const register = sinon.spy()
  const rehydrate = sinon.spy()

  const initialState = reducer(undefined, { type: PERSIST, register, rehydrate })

  // Rehydrate with only 'a' in 'foo' — 'b' and all of 'bar' are absent from payload
  const rehydratedState = reducer(initialState, {
    type: REHYDRATE,
    key: config.key,
    payload: { foo: { a: 'persisted_a' } },
  })

  // autoMergeLevel2: 'b' from the reducer's initial state should be preserved
  t.deepEqual(rehydratedState.foo, { a: 'persisted_a', b: 'reducer_b' })
  t.deepEqual(rehydratedState.bar, { c: 'reducer_c', d: 'reducer_d' })
})
