import { Action, AnyAction, CombinedState, combineReducers, Reducer, ReducersMapObject } from 'redux'
import persistReducer from './persistReducer'
import autoMergeLevel2 from './stateReconciler/autoMergeLevel2'

import type {
  PersistConfig
} from './types'

// combineReducers + persistReducer with stateReconciler defaulted to autoMergeLevel2
export default function persistCombineReducers<S>(
  config: PersistConfig<any>,
  reducers: ReducersMapObject<CombinedState<S>, Action<any>>
): Reducer<any, AnyAction> {
  config.stateReconciler =
    config.stateReconciler === undefined
      ? autoMergeLevel2
      : config.stateReconciler
  return persistReducer(config, combineReducers(reducers))
}
