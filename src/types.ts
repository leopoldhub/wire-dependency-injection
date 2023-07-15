// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClassType = new (...args: any) => any;

export type BeanType = 'bean' | (string & NonNullable<unknown>);
export type ContainerIdType = 'default' | (string & NonNullable<unknown>);

//we trick typescript and avoid errors by setting val type to undefined
export type AutowiredDescriptor = (val: undefined) => void;

export type RegisterBeanArgs = {
  id?: string;
  type?: BeanType;
  containerId?: ContainerIdType;
};
