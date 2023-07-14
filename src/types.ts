export type ClassType = new (...args: unknown[]) => unknown;

export type BeanType = 'bean' | (string & NonNullable<unknown>);
export type ContainerIdType = 'default' | (string & NonNullable<unknown>);

//we trick typescript and avoid errors by setting val type to undefined
export type AutowiredDescriptor = (val: undefined) => void;
