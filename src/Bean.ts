/* eslint-disable @typescript-eslint/ban-types */
import { BeanBehaviour, ClassType } from './types.js';
import { isClass } from './utils.js';

type BeanContentParameter =
  | { initializer: Function | ClassType; value?: unknown }
  | {
      initializer?: Function | ClassType;
      value: unknown;
    };

type BeanOptions = {
  behaviour: BeanBehaviour;
  wiring?: Array<string>;
};

export default class Bean {
  private readonly _identifier: string;
  private readonly _initializer?: Function | ClassType;
  private _value?: unknown;
  private readonly _options: BeanOptions;

  public constructor(
    identifier: string,
    content: BeanContentParameter,
    options: BeanOptions
  ) {
    this._identifier = identifier;
    this._initializer = content.initializer;
    this._value = content.value;
    this._options = options;
  }

  public initialize(...wires: Array<unknown>) {
    if (isClass(this._initializer as Function)) {
      this._value = new (this._initializer as unknown as ClassType)(...wires);
      return;
    }
    this._value = (this._initializer as Function)(wires);
  }

  public get identifier(): string {
    return this._identifier;
  }

  public get initializer(): Function | ClassType | undefined {
    return this._initializer;
  }

  public get value(): unknown {
    return this._value;
  }

  public get options(): BeanOptions {
    return this._options;
  }

  public isReady(): boolean {
    return !!this.value;
  }
}
