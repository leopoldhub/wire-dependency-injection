import { ClassType } from './types.js';

export const parseId = (id: string | ClassType) => {
  if (typeof id === 'string') {
    return id;
  }
  return id.name;
};
