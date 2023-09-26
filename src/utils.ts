/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/ban-types*/
import { BeanIdentifier, BeanSearch } from './types';

export function isClass(obj: Function) {
  return (
    obj?.constructor?.toString?.()?.startsWith('class ') ||
    obj?.prototype?.constructor?.toString?.()?.startsWith('class ')
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

export function extractBeanSearch(
  search: BeanIdentifier | BeanSearch
): BeanSearch {
  return {
    identifier:
      // @ts-ignore
      search.identifier || search.category ? search.identifier : search,
    // @ts-ignore
    category: search.category,
    // @ts-ignore
    getFirst: !!search.getFirst,
  };
}
