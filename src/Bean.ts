/* eslint-disable @typescript-eslint/ban-types */
import {
  BeanCategory,
  BeanContentParameter,
  BeanIdentifier,
  BeanInitializer,
  BeanOptions,
  BeanValue,
  ClassType,
} from './types.js';
import { isClass } from './utils.js';
import BeanInitializerNotInstantiable from './error/bean/BeanInitializerNotInstantiable.js';
import BeanAlreadyInitialized from './error/bean/BeanAlreadyInitialized.js';
import { NO_INSTANCE } from './beanBehaviours.js';

/**
 * A bean is an object that contains all the information about
 * a dependency and is managed by the DependencyManager.
 */
export default class Bean {
  private readonly _identifier: BeanIdentifier;
  private readonly _category: BeanCategory;
  private readonly _initializer?: BeanInitializer;
  private _value?: BeanValue;
  private readonly _options: BeanOptions;
  private _ready: boolean;

  /**
   * @param identifier unique dependency identifier.
   * @param content value, initializer or both.
   * @param options options for behaviour and wiring.
   * @param ready ready to use state.
   */
  public constructor(
    identifier: BeanIdentifier,
    content: BeanContentParameter,
    options: BeanOptions,
    ready?: boolean
  ) {
    this._identifier = identifier;
    this._category = content.category;
    this._initializer = content.initializer;
    this._value = content.value;
    this._options = options;
    this._ready = ready ?? options.behaviour === NO_INSTANCE;
  }

  /**
   * Initializes and declare the value.
   * @throws BeanAlreadyInitialized if already initialized.
   * @throws BeanInitializerNotInstantiable if the initializer is neither a function nor a class.
   * @param wireValues parameters for initialization.
   */
  public initialize(...wireValues: Array<BeanValue>) {
    if (this._ready) {
      throw new BeanAlreadyInitialized(this);
    }
    if (this._initializer === undefined) {
      throw new BeanInitializerNotInstantiable(this);
    }
    if (isClass(this._initializer as Function)) {
      this._value = new (this._initializer as unknown as ClassType)(
        ...wireValues
      );
    } else {
      this._value = (this._initializer as Function)(wireValues);
    }
    this._ready = true;
  }

  public get identifier(): BeanIdentifier {
    return this._identifier;
  }

  public get category(): BeanCategory {
    return this._category;
  }

  public get initializer(): BeanInitializer | undefined {
    return this._initializer;
  }

  public get value(): BeanValue {
    return this._value;
  }

  public get options(): BeanOptions {
    return this._options;
  }

  public isReady(): boolean {
    return this._ready;
  }
}
