import test from 'ava'
import sinon from 'sinon'
import createMemoryStorage from './utils/createMemoryStorage'
import createPersistoid from '../src/createPersistoid'

let memoryStorage: ReturnType<typeof createMemoryStorage>
let spy: sinon.SinonSpy
let clock: sinon.SinonFakeTimers

test.beforeEach(() => {
  memoryStorage = createMemoryStorage()
  spy = sinon.spy(memoryStorage, 'setItem')
  clock = sinon.useFakeTimers()
})

test.afterEach(() => {
  spy.restore()
  clock.restore()
})

// Issue #720: Total write time multiplies by the number of changed keys.
// With N keys and throttle T, write time should be ~T ms, not N × T ms.
// This test purposely fails to surface the bug. Will address in a later PR.
test.serial(
  'FAILING: write time grows with key count — 3 changed keys at throttle=100ms should produce one write within 100ms, not after 3×100ms=300ms (issue #720)',
  (t) => {
    const { update } = createPersistoid({ key: 'test', version: 1, storage: memoryStorage, throttle: 100 })
    update({ a: 1, b: 2, c: 3 })

    // Advance exactly one throttle interval. The correct behavior is for all 3 keys
    // to be batched and written in this single interval.
    clock.tick(100)

    // BUG: only key 'a' has been processed so far; 'b' and 'c' are still queued.
    // writeStagedState() is not called until the queue empties, which requires 3 ticks
    // (300ms total). So storage.setItem has not been called yet.
    t.true(spy.calledOnce)
  }
)

// Issue #888: setInterval(fn, 0) is asynchronous even when throttle=0.
// In a beforeunload handler the browser closes the tab before any queued callbacks
// fire, so state dispatched just before tab close is silently lost.
// This test purposely fails to surface the bug. Will address in a later PR.
test.serial(
  'FAILING: throttle=0 writes are not synchronous — state is lost if the event loop does not advance (issue #888)',
  (t) => {
    const { update } = createPersistoid({ key: 'test', version: 1, storage: memoryStorage, throttle: 0 })
    update({ a: 1 })

    // No clock advancement here. If writes were synchronous (the intended behaviour
    // of throttle=0), storage.setItem would already have been called. But because the
    // implementation uses setInterval(fn, 0), the callback is always async: it will
    // not fire until the next event loop turn, which never comes during beforeunload.
    // BUG: setItem has not been called.
    t.true(spy.calledOnce)
  }
)

// Issue #1171: Rapid state updates can starve the write queue indefinitely.
// Because only one key is processed per throttle tick, new updates can re-queue
// the just-processed key before the queue empties, keeping keysToProcess.length > 0
// forever and preventing writeStagedState() from ever being called.
// This test purposely fails to surface the bug. Will address in a later PR.
test.serial(
  'FAILING: rapid updates starve the write queue — storage.setItem is never called when updates continuously re-queue keys (issue #1171)',
  (t) => {
    const { update } = createPersistoid({ key: 'test', version: 1, storage: memoryStorage, throttle: 100 })
    update({ a: 1, b: 2, c: 3, d: 4, e: 5 })

    // Each clock.tick(100) fires processNextKey() once, removing one key from the queue.
    // The subsequent update() call changes all 5 values, re-queuing the key that was
    // just removed. The queue stays at length 5 and writeStagedState() is never reached.
    for (let i = 0; i < 5; i++) {
      clock.tick(100)
      update({ a: i + 2, b: i + 3, c: i + 4, d: i + 5, e: i + 6 })
    }

    // After 5 throttle intervals (500ms) we expect at least one write to storage.
    // BUG: the queue never empties, so writeStagedState() is never called and
    // storage.setItem is never invoked.
    t.true(spy.called)
  }
)
