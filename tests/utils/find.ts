/* eslint-disable @typescript-eslint/no-explicit-any */
// @TODO: Need to specify what is the expected return value from this function. Is it Record<string, string> or can it also be null or undefind?
export default (collection: Array<Record<string, any>>, predicate: Record<string, string>): any => {
  let result = {}
  collection.forEach((value: any) => {
    if (value.type && value.type === predicate.type) {
      result = value
    }
  })
  return result
}
