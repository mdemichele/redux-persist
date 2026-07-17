import test from 'ava'
import sinon from 'sinon'
import createMemoryStorage from './utils/createMemoryStorage'
import createPersistoid from '../src/createPersistoid'
const memoryStorage = createMemoryStorage()

const config = {
  key: 'persist-reducer-test',
  version: 1,
  storage: memoryStorage,
  debug: true,
}

let spy: sinon.SinonSpy
let clock: sinon.SinonFakeTimers

test.beforeEach(() => {
  spy = sinon.spy(memoryStorage, 'setItem')
  clock = sinon.useFakeTimers()
})

test.afterEach(() => {
  spy.restore()
  clock.restore()
})

test.serial('it updates changed state', (t) => {
  const { update } = createPersistoid(config)
  update({ a: 1 })
  clock.tick(1)
  update({ a: 2 })
  clock.tick(1)
  t.true(spy.calledTwice)
  t.true(spy.withArgs('persist:persist-reducer-test', '{"a":"1"}').calledOnce)
  t.true(spy.withArgs('persist:persist-reducer-test', '{"a":"2"}').calledOnce)
})

test.serial('it does not update unchanged state', (t) => {
  const { update } = createPersistoid(config)
  update({ a: undefined, b: 1 })
  clock.tick(1)
  // This update should not cause a write.
  update({ a: undefined, b: 1 })
  clock.tick(1)
  t.true(spy.calledOnce)
  t.true(spy.withArgs('persist:persist-reducer-test', '{"b":"1"}').calledOnce)
})

test.serial('it updates removed keys - first test', (t) => {
  const { update } = createPersistoid(config)
  update({ a: undefined, b: 1 })
  clock.tick(1)
  update({ a: undefined, b: undefined })
  clock.tick(1)
  t.true(spy.calledTwice)
  t.true(spy.withArgs('persist:persist-reducer-test', '{"b":"1"}').calledOnce)
  t.true(spy.withArgs('persist:persist-reducer-test', '{}').calledOnce)
})

test.serial('it updates removed keys - second test', (t) => {
  const { update } = createPersistoid(config)
  update({ a: 1, b: undefined })
  clock.tick(1)
  update({ a: undefined, b: undefined })
  clock.tick(1)
  t.true(spy.calledTwice)
  t.true(spy.withArgs('persist:persist-reducer-test', '{"a":"1"}').calledOnce)
  t.true(spy.withArgs('persist:persist-reducer-test', '{}').calledOnce)
})

test.serial('it updates removed keys -  third test', (t) => {
  const { update } = createPersistoid(config)
  update({ a: 1, b: 2 })
  clock.tick(1)
  update({ b: 2 })
  clock.tick(1)
  t.true(spy.calledTwice)
  t.true(spy.withArgs('persist:persist-reducer-test', '{"a":"1","b":"2"}').calledOnce)
  t.true(spy.withArgs('persist:persist-reducer-test', '{"b":"2"}').calledOnce)
})

test.serial('flush() immediately writes pending state without waiting for the throttle timer', async (t) => {
  const { flush, update } = createPersistoid(config)
  update({ a: 1 })
  // Do not tick the clock — flush must bypass the throttle and write immediately
  await flush()
  t.true(spy.calledOnce)
  t.true(spy.withArgs('persist:persist-reducer-test', '{"a":"1"}').calledOnce)
})

test.serial('writeStagedState routes a synchronous serialization error to writeFailHandler instead of throwing', (t) => {
  const rangeError = new RangeError('String length exceeds limit')
  const writeFailHandler = sinon.spy()

  const throwingConfig = {
    key: 'persist-reducer-test',
    version: 1,
    storage: memoryStorage,
    serialize: () => {
      throw rangeError
    },
    writeFailHandler,
  }

  const { update, flush } = createPersistoid(throwingConfig)
  update({ a: 1 })

  // Should not throw — the RangeError must be caught and routed to writeFailHandler
  t.notThrows(() => flush())

  // writeFailHandler receives the error instead of it propagating
  t.true(writeFailHandler.calledOnce)
  t.is(writeFailHandler.firstCall.args[0], rangeError)

  // storage.setItem must never be called when serialization fails
  t.false(spy.called)
})
