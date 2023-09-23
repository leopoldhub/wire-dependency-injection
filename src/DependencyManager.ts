import EventEmitter from 'events';
import Bean from './Bean.js';
import IdentifierAlreadyExistsError from './error/identifier/IdentifierAlreadyExistsError.js';
import { CAUTIOUS, EAGER, LAZY, NO_INSTANCE } from './beanBehaviours.js';
import {
  BeanIdentifier,
  BeanInitializer,
  BeanValue,
  Connector,
  ConnectorCallback,
  Couple,
  InstanceParameters,
} from './types.js';
import MissingBeanInitializerError from './error/bean/MissingBeanInitializerError.js';
import MissingDependenciesError from './error/MissingDependenciesError.js';
import IdentifierNotFoundError from './error/identifier/IdentifierNotFoundError.js';
import BeanNotReadyError from './error/bean/BeanNotReadyError.js';
import { uniqueArrayAsChildFilter } from './utils.js';
import InterDependencyError from './error/bean/InterDependencyError.js';
import DependencyInjectionError from './error/DependencyInjectionError.js';
import InvalidIdentifierError from './error/identifier/InvalidIdentifierError.js';
import SelfDependencyError from './error/bean/SelfDependencyError.js';

export const ErrorEventId = 'error';

export const DEFAULT_ERROR_HANDLER = console.error;

export class DependencyManager extends EventEmitter {
  private readonly _beans: Array<Bean> = [];
  private readonly _connectors: Array<Connector> = [];

  public constructor() {
    super({ captureRejections: true });
    this.on(ErrorEventId, DEFAULT_ERROR_HANDLER);
  }

  // ===== Bean Management =====
  public getReadyBeans() {
    return this._beans.filter((b) => b.isReady());
  }

  public getReadyBean(identifier: BeanIdentifier) {
    return this.getReadyBeans().find((b) => b.identifier === identifier);
  }

  public getUnreadyBeans() {
    return this._beans.filter((b) => !b.isReady());
  }

  public getUnreadyBean(identifier: BeanIdentifier) {
    return this.getUnreadyBeans().find((b) => b.identifier === identifier);
  }

  public getBeans() {
    return this._beans;
  }

  public getBean(identifier: BeanIdentifier) {
    return this._beans.find((bean) => bean.identifier === identifier);
  }

  private getInitializableBeans() {
    return this.getUnreadyBeans().filter(
      (bean) => bean.options.behaviour !== NO_INSTANCE
    );
  }

  public haveBean(identifier: BeanIdentifier) {
    return !!this.getBean(identifier);
  }

  private getBeanIndex(bean: Bean) {
    return this._beans.indexOf(bean);
  }

  private removeBeans(beans: Array<Bean>) {
    beans.forEach((bean) => this.removeBean(bean));
  }

  private removeBean(bean: Bean) {
    this._beans.splice(this.getBeanIndex(bean), 1);
  }

  private registerBean(bean: Bean) {
    if (this.haveBean(bean.identifier)) {
      throw new IdentifierAlreadyExistsError(bean.identifier);
    }
    this._beans.push(bean);
  }

  // ===== Bean Declaration =====
  public declare(identifier: BeanIdentifier, value: BeanValue) {
    const identifierValue = this.parseIdentifier(identifier ?? value);
    const bean = new Bean(
      identifierValue,
      { value: value },
      { behaviour: NO_INSTANCE },
      true
    );
    this.registerBean(bean);
    this.resolveBeans();
  }

  public instance(
    identifier: BeanIdentifier,
    value: BeanInitializer,
    options: InstanceParameters = { behaviour: CAUTIOUS }
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
    const wires = (bean.options.wiring ?? [])?.map((w) => this.getReadyBean(w));
    return !wires?.some((w) => w === undefined);
  }

  private initializeBean(bean: Bean) {
    try {
      if (!this.canBeanBeInitialized(bean)) {
        if (!bean.initializer) {
          throw new MissingBeanInitializerError(bean);
        }
        throw new MissingDependenciesError(
          bean,
          (bean.options.wiring ?? []).filter((w) => !this.getReadyBean(w))
        );
      }

      const wiresValues = (bean.options.wiring ?? [])?.map(
        (w) => this.getReadyBean(w)?.value
      );
      bean.initialize(...wiresValues);
    } catch (e) {
      this.removeBean(bean);
      this.emit(ErrorEventId, e as Error);
      throw e;
    }
  }

  // ===== Bean Wiring =====
  public wire<T extends BeanValue = BeanValue>(identifier: BeanIdentifier) {
    let bean = this.getReadyBean(identifier);
    if (!bean) {
      bean = this.getBean(identifier);
      if (bean) {
        if (
          bean.options.behaviour === LAZY &&
          this.canBeanBeInitialized(bean)
        ) {
          try {
            this.initializeBean(bean);
          } catch (e) {
            throw new IdentifierNotFoundError(identifier);
          }
        } else {
          throw new BeanNotReadyError(bean);
        }
      } else {
        throw new IdentifierNotFoundError(identifier);
      }
    }
    return bean.value as T;
  }

  public autoWire<T extends BeanValue = BeanValue>(
    identifier: BeanIdentifier,
    callback: ConnectorCallback<T>
  ) {
    this._connectors.push({ identifier: identifier, callback: callback });
    this.resolveConnectors();
  }

  // ===== Resolvers =====
  private resolveSelfDependencies() {
    this.getUnreadyBeans()
      .filter((bean) => bean.options.wiring?.includes(bean.identifier))
      .forEach((bean) => {
        this.removeBean(bean);
        this.emit(ErrorEventId, new SelfDependencyError(bean));
      });
  }

  private resolveInterDependencies() {
    this.getInterDependentCouples().forEach((couple) => {
      this.removeBeans(couple);
      this.emit(ErrorEventId, new InterDependencyError(couple));
    });
  }

  private getInterDependentCouples() {
    const initializeBeans = this.getInitializableBeans();
    const interDependantCouples = initializeBeans
      .flatMap((bean1) => {
        const wireBeans = (bean1.options.wiring ?? [])
          ?.map((w) => this.getUnreadyBean(w))
          .filter((bean) => bean !== undefined) as Array<Bean>;
        return wireBeans.map((bean2) => {
          if (bean1 === bean2 || this.areInterDependent(bean1, bean2)) {
            return ([bean1, bean2] as Couple<Bean>).sort(
              (a, b) => a?.identifier.localeCompare(b?.identifier)
            );
          }
        });
      })
      .filter((couple) => couple !== undefined) as Array<Couple<Bean>>;
    return uniqueArrayAsChildFilter(interDependantCouples);
  }

  private areInterDependent(bean1: Bean, bean2: Bean) {
    return (
      (bean1.options.wiring ?? []).includes(bean2.identifier) &&
      (bean2.options.wiring ?? []).includes(bean1.identifier)
    );
  }

  private resolveBeans() {
    this.resolveSelfDependencies();
    this.resolveInterDependencies();
    const unReadyBeans = this.getUnreadyBeans();
    const beansToInitialize = unReadyBeans.filter((b) =>
      [EAGER, CAUTIOUS].includes(b.options.behaviour)
    );
    const solvedSome = beansToInitialize.some((bean) => {
      if (bean.options.behaviour === EAGER || this.canBeanBeInitialized(bean)) {
        try {
          this.initializeBean(bean);
          return true;
        } catch (e) {
          /* empty */
        }
      }
    });
    if (solvedSome) {
      this.resolveBeans();
    }
  }

  private resolveConnectors() {
    this._connectors.forEach((connector) => {
      let bean = this.getBean(connector.identifier);
      if (
        bean &&
        bean.options.behaviour === LAZY &&
        this.canBeanBeInitialized(bean)
      ) {
        try {
          this.initializeBean(bean);
        } catch (e) {
          /* empty */
        }
      }
      bean = this.getReadyBean(connector.identifier);
      if (!bean) {
        return;
      }
      connector.callback(bean.value);
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
  private parseIdentifier(object: string | { name?: string }) {
    if (typeof object === 'string') {
      return object;
    }
    const identifier = object.name;
    if (identifier === undefined) {
      throw new InvalidIdentifierError(identifier);
    }
    return identifier;
  }
}

export default DependencyManager;
