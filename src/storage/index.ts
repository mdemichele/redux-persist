import createWebStorage from './createWebStorage'
export { default as createFilesystemStorage } from './createFilesystemStorage'
export type { FilesystemStorage, FilesystemStorageOptions } from '../types'

export default createWebStorage('local')
