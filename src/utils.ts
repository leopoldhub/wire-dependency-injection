// eslint-disable-next-line @typescript-eslint/ban-types
export function isClass(obj: Function) {
  return (
    obj?.constructor?.toString?.()?.startsWith('class') ||
    obj.prototype.constructor?.toString?.()?.startsWith('class')
  );
}

export function arrayIncludesArrayAsChild<T>(
  parent: Array<Array<T>>,
  search: Array<T>
) {
  return parent.some(
    (child) =>
      child === search ||
      (child.length === search.length &&
        child.every((element, index) => search[index] === element))
  );
}

export function uniqueArrayAsChildFilter<T extends Array<unknown>>(
  array: Array<T>
) {
  const uniqueArray: Array<T> = [];
  array.forEach((element) => {
    if (!arrayIncludesArrayAsChild(uniqueArray, element)) {
      uniqueArray.push(element);
    }
  });
  return uniqueArray;
}
