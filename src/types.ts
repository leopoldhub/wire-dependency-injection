// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClassType = new (...args: any) => any;

export type BeanType = 'bean' | (string & NonNullable<unknown>);
export type ContainerIdType = 'default' | (string & NonNullable<unknown>);

export type AutowiredDescriptor<
  T extends InstanceType<ClassType> = InstanceType<ClassType>,
> = (val: T) => unknown;

export type RegisterBeanArgs = {
  id?: string;
  type?: BeanType;
  containerId?: ContainerIdType;
};
