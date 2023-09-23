import EventEmitter from 'events';
import Bean from './Bean.js';
import IdentifierAlreadyExistsError from './error/identifier/IdentifierAlreadyExistsError.js';
import { CAUTIOUS, EAGER, LAZY, NO_INSTANCE } from './beanBehaviours.js';
import {
  Beancategory,
  BeanIdentifier,
  BeanInitializer,
  BeanSearch,
  BeanValue,
  Connector,
  ConnectorCallback,
  Couple,
  InstanceParameters,
} from './types.js';
import MissingBeanInitializerError from './error/bean/MissingBeanInitializerError.js';
import BeanNotFoundError from './error/BeanNotFoundError.js';
import BeanNotReadyError from './error/bean/BeanNotReadyError.js';
import InterDependencyError from './error/bean/InterDependencyError.js';
import DependencyInjectionError from './error/DependencyInjectionError.js';
import SelfDependencyError from './error/bean/SelfDependencyError.js';
import { extractBeanSearch, uniqueArrayAsChildFilter } from './utils.js';
import { BEAN } from './beanCategories.js';

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
  public getReadyBeans(category?: Beancategory) {
    return this._beans.filter(
      (b) => b.isReady() && (!category || b.category === category)
    );
  }

  public getReadyBean(search: BeanIdentifier | BeanSearch) {
    const searchOptions = extractBeanSearch(search);
    return this.getReadyBeans(searchOptions.category).find(
      (b) =>
        !searchOptions.identifier || b.identifier === searchOptions.identifier
    );
  }

  public getUnreadyBeans(category?: Beancategory) {
    return this._beans.filter(
      (b) => !b.isReady() && (!category || b.category === category)
    );
  }

  public getUnreadyBean(search: BeanIdentifier | BeanSearch) {
    const searchOptions = extractBeanSearch(search);
    return this.getUnreadyBeans(searchOptions.category).find(
      (b) =>
        !searchOptions.identifier || b.identifier === searchOptions.identifier
    );
  }

  public getBeans(category?: Beancategory) {
    return this._beans.filter((b) => !category || b.category === category);
  }

  public getBean(search: BeanIdentifier | BeanSearch) {
    const searchOptions = extractBeanSearch(search);
    return this.getBeans(searchOptions.category).find(
      (bean) =>
        !searchOptions.identifier ||
        bean.identifier === searchOptions.identifier
    );
  }

  private getInitializableBeans() {
    return this.getUnreadyBeans().filter(
      (bean) => bean.options.behaviour !== NO_INSTANCE
    );
  }

  public haveBean(search: BeanIdentifier | BeanSearch) {
    return !!this.getBean(search);
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
  public declare(
    identifier: BeanIdentifier,
    value: BeanValue,
    category: Beancategory = BEAN
  ) {
    const bean = new Bean(
      identifier,
      { value: value, category: category },
      { behaviour: NO_INSTANCE },
      true
    );
    this.registerBean(bean);
    this.resolveBeans();
  }

  public instance(
    identifier: BeanIdentifier,
    value: BeanInitializer,
    options: InstanceParameters = {}
  ) {
    const bean = new Bean(
      identifier,
      { initializer: value, category: options.category ?? BEAN },
      { behaviour: options.behaviour ?? CAUTIOUS, wiring: options.wiring }
    );
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
        throw new BeanNotReadyError(bean);
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
  public wire<T = any>(
    search: BeanIdentifier | BeanSearch,
    getFirst?: boolean
  ): T {
    const searchOptions = extractBeanSearch(search);
    const multiple = !searchOptions.identifier && !getFirst;
    if (!multiple) {
      return this.wireSingleBean(searchOptions).value as T;
    } else {
      return this.wireMultipleBeans(searchOptions).map(
        (bean) => bean.value
      ) as T;
    }
  }

  private wireSingleBean(beanSearch: BeanSearch) {
    let bean = this.getReadyBean(beanSearch);
    if (!bean) {
      bean = this.getBean(beanSearch);
      if (!bean) {
        throw new BeanNotFoundError(beanSearch.identifier, beanSearch.category);
      }
      if (bean.options.behaviour !== LAZY) {
        throw new BeanNotReadyError(bean);
      }
      this.initializeBean(bean);
    }
    return bean;
  }

  private wireMultipleBeans(beanSearch: BeanSearch) {
    this.getUnreadyBeans(beanSearch.category).forEach((bean) => {
      try {
        if (bean.options.behaviour === LAZY) {
          this.initializeBean(bean);
        }
      } catch (e) {
        /* empty */
      }
    });
    return this.getReadyBeans(beanSearch.category);
  }

  public autoWire<T = any>(
    search: BeanIdentifier | BeanSearch,
    callback: ConnectorCallback<T>,
    getFirst?: boolean
  ) {
    this._connectors.push({
      ...extractBeanSearch(search),
      getFirst: getFirst,
      callback: callback,
    });
    return this.resolveConnectors() as T;
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
    this.resolveConnectors();
  }

  private resolveConnectors() {
    this._connectors.forEach((connector) => {
      try {
        const value = this.wire(connector, connector.getFirst);
        connector.callback(value);
      } catch (e) {
        /* empty */
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
}

export default DependencyManager;
