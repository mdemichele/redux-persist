export interface FilesystemStorageOptions {
  storagePath: string
  encoding: string
  toFileName: (name: string) => string
  fromFileName: (name: string) => string
}

export interface FilesystemStorage {
  config: (customOptions: Partial<FilesystemStorageOptions>) => void
  setItem: (key: string, value: string, callback?: (error?: Error | null) => void) => Promise<void>
  getItem: (key: string, callback?: (error?: Error | null, result?: string | null) => void) => Promise<string | null | undefined>
  removeItem: (key: string, callback?: (error?: Error | null) => void) => Promise<undefined>
  getAllKeys: (callback?: (error?: Error | null, keys?: Array<string>) => any) => Promise<string[] | undefined>
  clear: (callback?: (error?: Error | null, allKeysCleared?: boolean) => void) => Promise<boolean>
}

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
    toFileName: (name: string) => name.split(':').join('-'),
    fromFileName: (name: string) => name.split('-').join(':'),
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
        .catch((error: Error) => callback && callback(error)),

    getItem: onStorageReady(
      (key: string, callback?: (error?: Error | null, result?: string | null) => void) => {
        const filePath = pathForKey(options.toFileName(key))

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
      const filePath = pathForKey(options.toFileName(key))

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
              callback && callback(null, files)
              if (!callback) {
                return files
              }
            })
        )
        .catch((error: Error) => {
          callback && callback(error)
          if (!callback) {
            throw error
          }
        }),

    clear: (callback?: (error?: Error | null, allKeysCleared?: boolean) => void) =>
      storage.getAllKeys((error, keys) => {
        if (error) throw error

        if (Array.isArray(keys) && keys.length) {
          const removedKeys: string[] = []

          keys.forEach((key) => {
            storage.removeItem(key, (error?: Error | null) => {
              removedKeys.push(key)
              if (error && callback) {
                callback(error, false)
              }
              if (removedKeys.length === keys.length && callback) {
                callback(null, true)
              }
            })
          })
          return true
        }

        callback && callback(null, false)
        return false
      }).catch((error: Error) => {
        callback && callback(error)
        if (!callback) {
          throw error
        }
      }),
  }

  return storage
}
