/* eslint-disable @typescript-eslint/ban-types,@typescript-eslint/no-unused-vars,@typescript-eslint/no-explicit-any */
import { ClassType, Couple, InstanceBeanBehaviour } from './types.js';
import Bean from './Bean.js';
import { arrayIncludesArrayAsChild } from './utils.js';
import EventEmitter from 'events';
import InterdependencyError from './error/bean/InterdependencyError.js';
import InvalidIdentifierError from './error/identifier/InvalidIdentifierError.js';
import IdentifierAlreadyExistsError from './error/identifier/IdentifierAlreadyExistsError.js';
import MissingBeanInitializerError from './error/bean/MissingBeanInitializerError.js';
import MissingDependenciesError from './error/MissingDependenciesError.js';
import IdentifierNotFoundError from './error/identifier/IdentifierNotFoundError.js';
import BeanNotReadyError from './error/bean/BeanNotReadyError.js';
import DependencyInjectionError from './error/DependencyInjectionError.js';

export const NO_INSTANCE = 'NO_INSTANCE';
export const CAUTIOUS = 'CAUTIOUS';
export const EAGER = 'EAGER';
export const LAZY = 'LAZY';

export const ErrorEventId = 'error';

export class DependencyManager extends EventEmitter {
  private readonly _beans: Array<Bean> = [];
  private readonly _connectors: Array<{
    identifier: string;
    callback: (value: unknown) => void;
  }> = [];

  public constructor() {
    super({ captureRejections: true });
    this.on(ErrorEventId, console.error);
  }

  // ===== Bean Management =====
  public getReadyBeans() {
    return this._beans.filter((b) => b.isReady());
  }

  public getReadyBean(identifier: string) {
    return this.getReadyBeans().find((b) => b.identifier === identifier);
  }

  public getUnreadyBeans() {
    return this._beans.filter((b) => !b.isReady());
  }

  public getUnreadyBean(identifier: string) {
    return this.getUnreadyBeans().find((b) => b.identifier === identifier);
  }

  public getBeans() {
    return this._beans;
  }

  public getBean(identifier: string) {
    return this._beans.find((bean) => bean.identifier === identifier);
  }

  public haveBean(identifier: string) {
    return !!this.getBean(identifier);
  }

  private getBeanIndex(bean: Bean) {
    return this._beans.indexOf(bean);
  }

  private removeBean(bean: Bean) {
    this._beans.splice(this.getBeanIndex(bean), 1);
  }

  public registerBean(bean: Bean) {
    if (this.haveBean(bean.identifier)) {
      throw new IdentifierAlreadyExistsError(bean.identifier);
    }
    this._beans.push(bean);
  }

  // ===== Bean Declaration =====
  public declare(identifier: string, value: unknown) {
    const identifierValue = this.parseIdentifier(identifier ?? value);
    const bean = new Bean(
      identifierValue,
      { value: value },
      { behaviour: NO_INSTANCE }
    );
    this.registerBean(bean);
    this.resolveBeans();
  }

  public instance(
    identifier: string,
    value: Function | ClassType,
    options: {
      behaviour: InstanceBeanBehaviour;
      wiring?: Array<string>;
    } = { behaviour: CAUTIOUS }
  ) {
    const identifierValue = this.parseIdentifier(identifier ?? value);
    const bean = new Bean(identifierValue, { initializer: value }, options);
    this.registerBean(bean);
    this.resolveBeans();
  }

  // ===== Bean Initialization =====
  private canBeanBeInitialized(bean: Bean) {
    if (bean.isReady() || !bean.initializer) {
      return false;
    }
    const wires = (bean.options.wiring ?? [])?.map(
      (w) => this.getReadyBean(w)?.value
    );
    return !wires?.some((w) => w === undefined);
  }

  private initializeBean(bean: Bean) {
    if (!this.canBeanBeInitialized(bean)) {
      if (!bean.initializer) {
        throw new MissingBeanInitializerError(bean);
      }
      throw new MissingDependenciesError(
        bean,
        (bean.options.wiring ?? []).filter((w) => !this.getReadyBean(w))
      );
    }

    const wires = (bean.options.wiring ?? [])?.map(
      (w) => this.getReadyBean(w)?.value
    );
    bean.initialize(...wires);
  }

  // ===== Bean Wiring =====
  public wire(identifier: string) {
    let bean = this.getReadyBean(identifier);
    if (!bean) {
      bean = this.getBean(identifier);
      if (bean) {
        if (bean.options.behaviour === LAZY) {
          try {
            this.initializeBean(bean);
          } catch (e) {
            this.removeBean(bean);
            this.emit(ErrorEventId, e as Error);
            throw new IdentifierNotFoundError(identifier);
          }
        } else {
          throw new BeanNotReadyError(bean);
        }
      } else {
        throw new IdentifierNotFoundError(identifier);
      }
    }
    return bean.value;
  }

  public autowire(identifier: string, callback: (value: unknown) => unknown) {
    this._connectors.push({ identifier: identifier, callback: callback });
    this.resolveConnectors();
  }

  // ===== Resolvers =====
  private resolveInterdependencies() {
    const interdependencyPairs: Array<Couple<Bean>> = [];
    this.getUnreadyBeans()
      .filter((bean) => bean.options.behaviour !== NO_INSTANCE)
      .forEach((bean1) => {
        bean1.options.wiring
          ?.map((w) => this.getUnreadyBean(w))
          .filter((bean) => bean !== undefined)
          .forEach((bean2) => {
            if (bean2?.options.wiring?.includes(bean1.identifier)) {
              const pair = ([bean1, bean2] as Couple<Bean>).sort(
                (a, b) => a?.identifier.localeCompare(b?.identifier)
              );
              if (!arrayIncludesArrayAsChild(interdependencyPairs, pair)) {
                interdependencyPairs.push(pair);
                this.removeBean(bean1);
                this.removeBean(bean2);
                this.emit(ErrorEventId, new InterdependencyError(pair));
              }
            }
          });
      });
  }

  private resolveBeans() {
    this.resolveInterdependencies();

    const unReadyBeans = this.getUnreadyBeans();

    let solvedSome = false;

    unReadyBeans
      .filter((b) => [EAGER, CAUTIOUS].includes(b.options.behaviour))
      .forEach((bean) => {
        try {
          if (
            bean.options.behaviour === EAGER ||
            this.canBeanBeInitialized(bean)
          ) {
            this.initializeBean(bean);
            solvedSome = true;
          }
        } catch (e) {
          this.removeBean(bean);
          this.emit(ErrorEventId, e as Error);
        }
      });

    if (solvedSome) {
      this.resolveBeans();
    }
  }

  private resolveConnectors() {
    this._connectors.forEach((connector) => {
      let bean = this.getBean(connector.identifier);
      if (bean && !bean.isReady() && bean.options.behaviour === LAZY) {
        try {
          this.initializeBean(bean);
        } catch (e) {
          this.removeBean(bean);
          this.emit(ErrorEventId, e as Error);
        }
      }
      bean = this.getReadyBean(connector.identifier);
      if (bean) {
        return connector.callback(bean.value);
      }
    });
  }

  // ===== Error Management =====
  public on(
    eventName: typeof ErrorEventId,
    listener: (error: DependencyInjectionError) => void
  ): this;
  public on(
    eventName: string | symbol,
    listener: (...args: any[]) => void
  ): this {
    return super.on(eventName, listener);
  }

  public once(
    eventName: typeof ErrorEventId,
    listener: (error: DependencyInjectionError) => void
  ): this;
  public once(
    eventName: string | symbol,
    listener: (...args: any[]) => void
  ): this {
    return super.once(eventName, listener);
  }

  public emit(eventName: typeof ErrorEventId, error: Error): boolean;
  public emit(eventName: string | symbol, ...args: any[]): boolean {
    return super.emit(eventName, ...args);
  }

  // ===== Utils =====
  private parseIdentifier(object: unknown) {
    if (typeof object === 'string') {
      return object;
    }
    const identifier = (object as { name?: string }).name;
    if (identifier === undefined) {
      throw new InvalidIdentifierError(identifier);
    }
    return identifier;
  }
}
