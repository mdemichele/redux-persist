import { createStore, applyMiddleware, AnyAction, Middleware, Reducer } from 'redux'

export function createTestStore(reducer: Reducer = (state = {}) => state) {
  const actions: AnyAction[] = []

  const actionRecorder: Middleware = () => (next) => (action) => {
    actions.push(action as AnyAction)
    return next(action)
  }

  const store = createStore(reducer, applyMiddleware(actionRecorder))

  return Object.assign(store, {
    getActions: () => actions,
    clearActions: () => {
      actions.length = 0
    },
  })
}
