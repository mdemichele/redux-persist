export default (collection: Array<Record<string, any>>, predicate: Record<string, string>): Record<string, any> | null => {
  let result: Record<string, any> | null = null
  collection.forEach((value: any) => {
    if (value.type && value.type === predicate.type) {
      result = value
    }
  })
  return result
}
