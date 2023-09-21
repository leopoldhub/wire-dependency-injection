// eslint-disable-next-line @typescript-eslint/ban-types
export function isClass(obj: Function) {
  return (
    obj?.constructor?.toString?.()?.startsWith('class') ||
    obj.prototype.constructor?.toString?.()?.startsWith('class')
  );
}

export function arrayIncludesArrayAsChild(
  parent: Array<Array<unknown>>,
  search: Array<unknown>
) {
  return parent.some(
    (child) =>
      child === search ||
      (child.length === search.length &&
        child.every((element, index) => search[index] === element))
  );
}
