import test from 'ava'
import createFilesystemStorage from '../src/storage/createFilesystemStorage'

// In-memory filesystem mock for react-native-blob-util
function createMockBlobUtil() {
  const dirs: Record<string, boolean> = { '/mock/documents': true }
  const files: Record<string, string> = {}

  return {
    fs: {
      dirs: {
        DocumentDir: '/mock/documents',
      },
      exists: (path: string) =>
        Promise.resolve(path in dirs || path in files),
      mkdir: (path: string) => {
        dirs[path] = true
        return Promise.resolve(true)
      },
      writeFile: (path: string, value: string, _encoding: string) => {
        files[path] = value
        return Promise.resolve()
      },
      readFile: (path: string, _encoding: string) => {
        if (path in files) return Promise.resolve(files[path])
        return Promise.reject(new Error(`File not found: ${path}`))
      },
      unlink: (path: string) => {
        delete files[path]
        return Promise.resolve()
      },
      ls: (dir: string) => {
        const prefix = dir + '/'
        const names = Object.keys(files)
          .filter(p => p.startsWith(prefix))
          .map(p => p.slice(prefix.length))
        return Promise.resolve(names)
      },
      _files: files,
      _dirs: dirs,
    },
  }
}

test('createFilesystemStorage returns a storage object with required methods', t => {
  const blob = createMockBlobUtil()
  const storage = createFilesystemStorage(blob)
  t.is(typeof storage.setItem, 'function')
  t.is(typeof storage.getItem, 'function')
  t.is(typeof storage.removeItem, 'function')
  t.is(typeof storage.getAllKeys, 'function')
  t.is(typeof storage.clear, 'function')
  t.is(typeof storage.config, 'function')
})

test('setItem writes a value and getItem reads it back', async t => {
  const blob = createMockBlobUtil()
  const storage = createFilesystemStorage(blob)
  await storage.setItem('my-key', 'my-value')
  const result = await storage.getItem('my-key')
  t.is(result, 'my-value')
})

test('keys containing dashes survive a round-trip from setItem to getItem', async t => {
  const blob = createMockBlobUtil()
  const storage = createFilesystemStorage(blob)
  await storage.setItem('persist:user-profile', 'data')
  t.deepEqual(await storage.getAllKeys(), ['persist:user-profile'])
  t.is(await storage.getItem('persist:user-profile'), 'data')
})

test('getItem returns null for a key that does not exist', async t => {
  const blob = createMockBlobUtil()
  const storage = createFilesystemStorage(blob)
  const result = await storage.getItem('nonexistent-key')
  t.is(result, null)
})

test('removeItem deletes a stored value', async t => {
  const blob = createMockBlobUtil()
  const storage = createFilesystemStorage(blob)
  await storage.setItem('delete-me', 'value')
  await storage.removeItem('delete-me')
  const result = await storage.getItem('delete-me')
  t.is(result, null)
})

test('removeItem is a no-op for a key that does not exist', async t => {
  const blob = createMockBlobUtil()
  const storage = createFilesystemStorage(blob)
  await t.notThrowsAsync(() => storage.removeItem('no-such-key'))
})

test('getAllKeys returns all stored keys', async t => {
  const blob = createMockBlobUtil()
  const storage = createFilesystemStorage(blob)
  await storage.setItem('a', '1')
  await storage.setItem('b', '2')
  await storage.setItem('c', '3')
  const keys = await storage.getAllKeys()
  t.deepEqual(keys?.sort(), ['a', 'b', 'c'])
})

test('getAllKeys returns empty array when no keys exist', async t => {
  const blob = createMockBlobUtil()
  const storage = createFilesystemStorage(blob)
  const keys = await storage.getAllKeys()
  t.deepEqual(keys, [])
})

test('clear removes all stored keys', async t => {
  const blob = createMockBlobUtil()
  const storage = createFilesystemStorage(blob)
  await storage.setItem('x', '1')
  await storage.setItem('y', '2')
  await storage.clear()
  const keys = await storage.getAllKeys()
  t.deepEqual(keys, [])
})

test('toFileName and fromFileName transforms are applied to keys', async t => {
  const blob = createMockBlobUtil()
  const storage = createFilesystemStorage(blob)
  // Default transforms: colons become dashes (and vice-versa)
  await storage.setItem('persist:root', 'data')
  const keys = await storage.getAllKeys()
  t.deepEqual(keys, ['persist:root'])
})

test('config overrides storagePath', async t => {
  const blob = createMockBlobUtil()
  blob.fs._dirs['/custom/path'] = true
  const storage = createFilesystemStorage(blob)
  storage.config({ storagePath: '/custom/path' })
  await storage.setItem('cfg-key', 'cfg-value')
  const result = await storage.getItem('cfg-key')
  t.is(result, 'cfg-value')
})

test('setItem calls callback on success', async t => {
  const blob = createMockBlobUtil()
  const storage = createFilesystemStorage(blob)
  await new Promise<void>(resolve => {
    storage.setItem('cb-key', 'cb-val', err => {
      t.is(err, undefined)
      resolve()
    })
  })
})

test('getAllKeys calls callback with keys', async t => {
  const blob = createMockBlobUtil()
  const storage = createFilesystemStorage(blob)
  await storage.setItem('k1', 'v1')
  await new Promise<void>(resolve => {
    storage.getAllKeys((err, keys) => {
      t.is(err, null)
      t.deepEqual(keys, ['k1'])
      resolve()
    })
  })
})
