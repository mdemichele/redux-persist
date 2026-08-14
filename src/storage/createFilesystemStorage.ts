import type { FilesystemStorageOptions, FilesystemStorage } from '../types'

export default function createFilesystemStorage(ReactNativeBlobUtil: any): FilesystemStorage {
  const createStoragePathIfNeeded = (path: string): Promise<any> =>
    ReactNativeBlobUtil.fs
      .exists(path)
      .then((exists: boolean) =>
        exists ? Promise.resolve(true) : ReactNativeBlobUtil.fs.mkdir(path)
      )

  const onStorageReadyFactory =
    (storagePath: string) =>
    (func: Function) => {
      const storage = createStoragePathIfNeeded(storagePath)
      return (...args: Array<any>) => storage.then(() => func(...args))
    }

  const defaultStoragePath = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/persistStore`

  let onStorageReady = onStorageReadyFactory(defaultStoragePath)
  let options: FilesystemStorageOptions = {
    storagePath: defaultStoragePath,
    encoding: 'utf8',
    toFileName: (name: string) => encodeURIComponent(name),
    fromFileName: (name: string) => decodeURIComponent(name),
  }

  const pathForKey = (key: string) => `${options.storagePath}/${options.toFileName(key)}`

  const storage: FilesystemStorage = {
    config: (customOptions: Partial<FilesystemStorageOptions>) => {
      options = {
        ...options,
        ...customOptions,
      }
      onStorageReady = onStorageReadyFactory(options.storagePath)
    },

    setItem: (key: string, value: string, callback?: (error?: Error | null) => void) =>
      ReactNativeBlobUtil.fs
        .writeFile(pathForKey(key), value, options.encoding)
        .then(() => callback && callback())
        .catch((error: Error) => {
          if (!callback) {
            throw error
          }
          callback(error)
        }),

    getItem: onStorageReady(
      (key: string, callback?: (error?: Error | null, result?: string | null) => void) => {
        const filePath = pathForKey(key)

        return ReactNativeBlobUtil.fs
          .readFile(filePath, options.encoding)
          .then((data: string) => {
            if (!callback) {
              return data
            }
            callback(null, data)
          })
          .catch((err: Error) =>
            ReactNativeBlobUtil.fs.exists(filePath).then((exists: boolean) => {
              if (!exists) {
                return null
              }
              if (!callback) {
                throw err
              }
              callback(err)
            })
          )
      }
    ),

    removeItem: (key: string, callback?: (error?: Error | null) => void) => {
      const filePath = pathForKey(key)

      const handleError = (err: Error) => {
        if (!callback) {
          throw err
        }
        callback(err)
      }

      return ReactNativeBlobUtil.fs
        .exists(filePath)
        .then((exists: boolean) => {
          if (!exists) {
            return undefined
          }
          return ReactNativeBlobUtil.fs
            .unlink(filePath)
            .then(() => callback && callback())
            .catch(handleError)
        })
        .catch(handleError)
    },

    getAllKeys: (callback?: (error?: Error | null, keys?: Array<string>) => any) =>
      ReactNativeBlobUtil.fs
        .exists(options.storagePath)
        .then((exists: boolean) =>
          exists ? true : ReactNativeBlobUtil.fs.mkdir(options.storagePath)
        )
        .then(() =>
          ReactNativeBlobUtil.fs
            .ls(options.storagePath)
            .then((files: string[]) => files.map((file) => options.fromFileName(file)))
            .then((files: string[]) => {
              if (!callback) {
                return files
              }
              callback(null, files)
            })
        )
        .catch((error: Error) => {
          if (!callback) {
            throw error
          }
          callback(error)
        }),

    clear: (callback?: (error?: Error | null, allKeysCleared?: boolean) => void) =>
      storage
        .getAllKeys()
        .then((keys) => {
          if (Array.isArray(keys) && keys.length) {
            return Promise.all(keys.map((key) => storage.removeItem(key))).then(() => {
              callback?.(null, true)
              return true
            })
          }
          callback?.(null, false)
          return false
        })
        .catch((error: Error) => {
          if (!callback) {
            throw error
          }
          callback(error)
          return false
        })
  }

  return storage
}
