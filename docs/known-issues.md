# Known Issues

Issues identified during pre-release review, targeted for fix in **0.0.2**.

---

## Bug 1 — First-run causes 5-second timeout and spurious console error

**File:** `src/persistReducer.ts:129–148`  
**Severity:** High — affects every new user on first run (or after clearing storage)

When `getStoredState` resolves with `undefined` (no stored state), the success callback has no `else` branch and never calls `_rehydrate`. The app waits the full 5-second default timeout before bootstrapping, and the timeout handler logs an error to the console even though nothing actually went wrong.

**Fix:** Add `else { _rehydrate(undefined) }` in the `getStoredState` success callback so a clean "no stored state" path rehydrates immediately without an error.

---

## Bug 2 — Noop storage crashes when `localStorage` is unavailable

**File:** `src/storage/getStorage.ts:4–11`  
**Severity:** High — crashes in SSR and strict private browsing environments

The fallback `noopStorage` uses `function noop() {}` which returns `undefined`. Callers in `getStoredState.ts` and `createPersistoid.ts` call `.then()` and `.catch()` on the return value, throwing `Cannot read property 'then' of undefined` when `localStorage` is unavailable.

**Fix:** Replace noop functions with ones that return resolved Promises (`() => Promise.resolve(null)`, etc.).

---

## Bug 3 — `serialize` type in `PersistConfig` doesn't allow a function

**File:** `src/types.ts:52`  
**Severity:** Low — TypeScript type-only issue, no runtime impact

`serialize` is typed as `boolean | undefined`, but `createPersistoid.ts` already handles `typeof config.serialize === 'function'` at runtime. The `deserialize` field (line 53) correctly includes `((x: any) => any)`. TypeScript users cannot pass a custom serializer function without a type error.

**Fix:** Update `serialize` type to `boolean | ((x: any) => any) | undefined` to match `deserialize` and the existing runtime behavior.

---

## Bug 4 — Three core `createPersistoid` tests are skipped

**File:** `tests/createPersistor.spec.ts`  
**Severity:** Medium — untested write behavior

Three tests covering `createPersistoid`'s write logic (changed state, unchanged state, removed keys) are marked `test.skip` with the note `// @NOTE these tests broke when updating sinon`. These cover important storage write behavior and should be restored.

**Fix:** Investigate the sinon `useFakeTimers` / `setInterval` interaction introduced when sinon was updated and restore the tests.
