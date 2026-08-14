import createWebStorage from './createWebStorage'
export { default as createFilesystemStorage } from './createFilesystemStorage'
export type { FilesystemStorage, FilesystemStorageOptions } from './createFilesystemStorage'

export default createWebStorage('local')
