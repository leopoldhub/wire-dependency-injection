/* eslint-disable @typescript-eslint/ban-types */
import {
  Beancategory,
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

export default class Bean {
  private readonly _identifier: BeanIdentifier;
  private readonly _category: Beancategory;
  private readonly _initializer?: BeanInitializer;
  private _value?: BeanValue;
  private readonly _options: BeanOptions;
  private _ready: boolean;

  public constructor(
    identifier: BeanIdentifier,
    content: BeanContentParameter,
    options: BeanOptions,
    ready: boolean = false
  ) {
    this._identifier = identifier;
    this._category = content.category;
    this._initializer = content.initializer;
    this._value = content.value;
    this._options = options;
    this._ready = ready;
  }

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

  public get category(): Beancategory {
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
