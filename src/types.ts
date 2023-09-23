/* eslint-disable @typescript-eslint/ban-types */
import { CAUTIOUS, EAGER, LAZY, NO_INSTANCE } from './beanBehaviours.js';
import { BEAN } from './beanCategories.js';

// eslint-disable-next-line
export type ClassType = new (...args: any) => any;

export type InstanceBeanBehaviour =
  | typeof CAUTIOUS
  | typeof EAGER
  | typeof LAZY;
export type BeanBehaviour = typeof NO_INSTANCE | InstanceBeanBehaviour;

export type Beancategory = typeof BEAN | (string & {});

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
) & { category: Beancategory };

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
  category?: Beancategory;
};

export type Connector = (
  | {
      identifier: BeanIdentifier;
      category: Beancategory;
    }
  | {
      identifier?: BeanIdentifier;
      category: Beancategory;
    }
  | {
      identifier: BeanIdentifier;
      category?: Beancategory;
    }
) & {
  getFirst?: boolean;
  callback: ConnectorCallback;
};

export type ConnectorCallback<T extends BeanValue = BeanValue> = (
  value: T
) => void;

export type Wire = BeanIdentifier;

export type BeanSearch =
  | { identifier: BeanIdentifier; category: Beancategory }
  | {
      identifier?: BeanIdentifier;
      category: Beancategory;
    }
  | { identifier: BeanIdentifier; category?: Beancategory };
