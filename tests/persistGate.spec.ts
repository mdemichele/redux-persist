import { GlobalRegistrator } from '@happy-dom/global-registrator'
GlobalRegistrator.register()
// Required for React's act() to work in non-browser test environments
;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true

import test from 'ava'
import { createElement, act } from 'react'
import { createRoot } from 'react-dom/client'
import { PersistGate } from '../src/integration/react'

type MockPersistor = ReturnType<typeof createMockPersistor>

function createMockPersistor(initialBootstrapped = false) {
  let bootstrapped = initialBootstrapped
  const subscribers = new Set<() => void>()
  return {
    getState: () => ({ bootstrapped, registry: [] as string[] }),
    subscribe: (cb: () => void) => {
      subscribers.add(cb)
      return () => { subscribers.delete(cb) }
    },
    setBootstrapped(value: boolean) {
      bootstrapped = value
      subscribers.forEach(cb => cb())
    },
    pause: () => {},
    persist: () => {},
    purge: () => Promise.resolve(),
    flush: () => Promise.resolve(),
    dispatch: (action: any) => action,
  }
}

async function withRoot(
  persistor: MockPersistor,
  props: Record<string, unknown>,
  children: unknown,
  fn: (container: HTMLElement) => Promise<void>
) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  await act(async () => {
    root.render(createElement(PersistGate as any, { persistor, ...props }, children))
  })

  try {
    await fn(container)
  } finally {
    await act(async () => { root.unmount() })
    container.remove()
  }
}

// All tests are serial: React's act() does not support concurrent calls across tests
test.serial('shows loading before persistor is bootstrapped', async t => {
  const persistor = createMockPersistor(false)
  await withRoot(
    persistor,
    { loading: createElement('span', null, 'loading') },
    createElement('div', null, 'content'),
    async container => {
      t.is(container.textContent, 'loading')
    }
  )
})

test.serial('shows children after persistor bootstraps', async t => {
  const persistor = createMockPersistor(false)
  await withRoot(
    persistor,
    { loading: createElement('span', null, 'loading') },
    createElement('div', null, 'content'),
    async container => {
      t.is(container.textContent, 'loading')
      await act(async () => { persistor.setBootstrapped(true) })
      t.is(container.textContent, 'content')
    }
  )
})

test.serial('renders children immediately when already bootstrapped on mount', async t => {
  const persistor = createMockPersistor(true)
  await withRoot(
    persistor,
    { loading: createElement('span', null, 'loading') },
    createElement('div', null, 'content'),
    async container => {
      t.is(container.textContent, 'content')
    }
  )
})

test.serial('function child receives false before bootstrap', async t => {
  const persistor = createMockPersistor(false)
  await withRoot(
    persistor,
    {},
    (bootstrapped: boolean) => createElement('span', null, String(bootstrapped)),
    async container => {
      t.is(container.textContent, 'false')
    }
  )
})

test.serial('function child receives true after bootstrap', async t => {
  const persistor = createMockPersistor(false)
  await withRoot(
    persistor,
    {},
    (bootstrapped: boolean) => createElement('span', null, String(bootstrapped)),
    async container => {
      t.is(container.textContent, 'false')
      await act(async () => { persistor.setBootstrapped(true) })
      t.is(container.textContent, 'true')
    }
  )
})

test.serial('calls onBeforeLift before showing children', async t => {
  const persistor = createMockPersistor(false)
  const calls: string[] = []
  await withRoot(
    persistor,
    {
      loading: createElement('span', null, 'loading'),
      onBeforeLift: () => { calls.push('lifted') },
    },
    createElement('div', null, 'content'),
    async container => {
      t.is(container.textContent, 'loading')
      await act(async () => { persistor.setBootstrapped(true) })
      t.deepEqual(calls, ['lifted'])
      t.is(container.textContent, 'content')
    }
  )
})

test.serial('calls onBeforeLift when already bootstrapped on mount', async t => {
  const persistor = createMockPersistor(true)
  const calls: string[] = []
  await withRoot(
    persistor,
    {
      loading: createElement('span', null, 'loading'),
      onBeforeLift: () => { calls.push('lifted') },
    },
    createElement('div', null, 'content'),
    async container => {
      t.deepEqual(calls, ['lifted'])
      t.is(container.textContent, 'content')
    }
  )
})

test.serial('warns in dev when both function child and loading prop are provided', async t => {
  const persistor = createMockPersistor(false)
  const errors: string[] = []
  const original = console.error
  console.error = (...args: unknown[]) => errors.push(String(args[0]))

  try {
    await withRoot(
      persistor,
      { loading: createElement('span', null, 'loading') },
      () => createElement('div', null, 'content'),
      async () => {
        t.true(errors.some(e => e.includes('PersistGate expects either a function child')))
      }
    )
  } finally {
    console.error = original
  }
})
