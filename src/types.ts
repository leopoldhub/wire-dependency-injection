// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClassType = new (...args: any) => any;

export type InstanceBeanBehaviour = 'CAUTIOUS' | 'EAGER' | 'LAZY';
export type BeanBehaviour = 'NO_INSTANCE' | InstanceBeanBehaviour;

export type Couple<T> = [T, T];
