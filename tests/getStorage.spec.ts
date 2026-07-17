import test from 'ava'
import getStorage from '../src/storage/getStorage'


test('getStorage returns noopStorage when storageType does not have a support storage engine', (t) => {
    let storage = getStorage('')
    let actualNoopReturnValue = storage.getItem("")
    let expectedValue = undefined

    t.truthy(storage)
    t.is(actualNoopReturnValue, expectedValue)
})

// TODO: This test purposely fails. Resolve underlying issue.
test('getStorage methods will error out when trying to call a .then statement on a noop', (t) => {
    let storage = getStorage('')

    let errorOut = storage.getItem("").then(() =>
        console.log("this console.log shouldn't run. An error should be thrown by the .then() statement. ")
    )
})
