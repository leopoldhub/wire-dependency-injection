export type ClassType = new (...args: Array<unknown>) => unknown;

export type BeanType = 'bean' | (string & NonNullable<unknown>);
export type ContainerId = 'default' | (string & NonNullable<unknown>);

//we trick typescript and avoid errors by setting val type to undefined
export type AutowiredDescriptor = (val: undefined) => void;
