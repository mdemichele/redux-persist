import test from 'ava'
import getStorage from '../src/storage/getStorage'


test('getStorage returns noopStorage when storageType does not have a support storage engine', (t) => {
    let storage = getStorage('')
    t.truthy(storage)
})

test('getStorage noop methods return a Promise so callers can chain .then() without crashing', async (t) => {
    let storage = getStorage('')

    const result = await storage.getItem('').then(() => 'resolved')
    t.is(result, 'resolved')
})
