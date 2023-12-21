/* eslint-disable @typescript-eslint/ban-types */
import { CAUTIOUS, EAGER, LAZY, NO_INSTANCE } from './beanBehaviours.js';
import { BEAN } from './beanCategories.js';

// eslint-disable-next-line
export type ClassType = new (...args: any) => any;

/**
 * A behaviour indicates how a bean should act when resolving and instancing.
 * Behaviours who allows instancing.
 */
export type InstanceBeanBehaviour =
  | typeof CAUTIOUS
  | typeof EAGER
  | typeof LAZY;
/**
 * A behaviour indicates how a bean should act when resolving and instancing.
 */
export type BeanBehaviour = typeof NO_INSTANCE | InstanceBeanBehaviour;

export type BeanCategory = typeof BEAN | (string & {});

export type Couple<T> = [T, T];

export type BeanContentParameter = (
  | {
      initializer: BeanInitializer;
      value: BeanValue;
    }
  | {
      initializer?: BeanInitializer;
      value: BeanValue;
    }
  | {
      initializer: BeanInitializer;
      value?: BeanValue;
    }
) & { category: BeanCategory };

export type BeanOptions = {
  behaviour: BeanBehaviour;
  wiring?: Array<Wire>;
};

export type BeanIdentifier = string;

export type BeanInitializer = Function | ClassType;

export type BeanValue = any;

export type InstanceParameters = {
  behaviour?: InstanceBeanBehaviour;
  wiring?: Array<Wire>;
  category?: BeanCategory;
};

export type Connector = BeanSearch & {
  callback: ConnectorCallback;
};

export type ConnectorCallback<T extends BeanValue = BeanValue> = (
  value: T
) => void;

export type Wire = BeanIdentifier | WireBeanSearch;

export type WireBeanSearch = BeanSearch & { nonTransferable?: boolean };

export type BeanSearch = (
  | { identifier: BeanIdentifier; category: BeanCategory }
  | {
      identifier?: BeanIdentifier;
      category: BeanCategory;
    }
  | { identifier: BeanIdentifier; category?: BeanCategory }
) & {
  getFirst?: boolean;
};
