/* eslint-disable @typescript-eslint/ban-types */
import { CAUTIOUS, EAGER, LAZY, NO_INSTANCE } from './beanBehaviours.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClassType = new (...args: any) => any;

export type InstanceBeanBehaviour =
  | typeof CAUTIOUS
  | typeof EAGER
  | typeof LAZY;
export type BeanBehaviour = typeof NO_INSTANCE | InstanceBeanBehaviour;

export type Couple<T> = [T, T];

export type BeanContentParameter =
  | { initializer: BeanInitializer; value?: BeanValue }
  | {
      initializer?: BeanInitializer;
      value: BeanValue;
    };

export type BeanOptions = {
  behaviour: BeanBehaviour;
  wiring?: Array<Wire>;
};

export type BeanIdentifier = string;

export type BeanInitializer = Function | ClassType;

export type BeanValue = any;

export type InstanceParameters = BeanOptions & {
  behaviour: InstanceBeanBehaviour;
};

export type Connector = {
  identifier: BeanIdentifier;
  callback: ConnectorCallback;
};

export type ConnectorCallback<T extends BeanValue = BeanValue> = (
  value: T
) => void;

export type Wire = BeanIdentifier;
