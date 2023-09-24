import EventEmitter from 'events';
import Bean from './Bean.js';
import IdentifierAlreadyExistsError from './error/identifier/IdentifierAlreadyExistsError.js';
import { CAUTIOUS, EAGER, LAZY, NO_INSTANCE } from './beanBehaviours.js';
import {
  BeanCategory,
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

/**
 * A DependencyManager controls, registers, wires and distributes dependencies.
 */
export class DependencyManager extends EventEmitter {
  private readonly _beans: Array<Bean> = [];
  private readonly _connectors: Array<Connector> = [];

  public constructor() {
    super({ captureRejections: true });
    this.on(ErrorEventId, DEFAULT_ERROR_HANDLER);
  }

  // ===== Bean Management =====
  /**
   * Returns beans with ready state, filtered by category if précised.
   * @param category filter.
   * @private
   */
  private getReadyBeans(category?: BeanCategory) {
    return this._beans.filter(
      (b) => b.isReady() && (!category || b.category === category)
    );
  }

  /**
   * Returns bean with ready state by identifier and category if précised.
   * @param search identifier, category or both.
   * @private
   */
  private getReadyBean(search: BeanSearch) {
    return this.getReadyBeans(search.category).find(
      (b) => !search.identifier || b.identifier === search.identifier
    );
  }

  /**
   * Returns beans with unready state, filtered by category if précised.
   * @param category filter.
   * @private
   */
  private getUnreadyBeans(category?: BeanCategory) {
    return this._beans.filter(
      (b) => !b.isReady() && (!category || b.category === category)
    );
  }

  /**
   * Returns bean with unready state by identifier and category if précised.
   * @param search identifier, category or both.
   * @private
   */
  private getUnreadyBean(search: BeanSearch) {
    return this.getUnreadyBeans(search.category).find(
      (b) => !search.identifier || b.identifier === search.identifier
    );
  }

  /**
   * Returns all beans, filtered by category if précised.
   * @param category filter.
   * @private
   */
  private getBeans(category?: BeanCategory) {
    return this._beans.filter((b) => !category || b.category === category);
  }

  /**
   * Returns bean by identifier and category if précised.
   * @param search identifier, category or both.
   * @private
   */
  private getBean(search: BeanSearch) {
    return this.getBeans(search.category).find(
      (bean) => !search.identifier || bean.identifier === search.identifier
    );
  }

  private haveBean(search: BeanSearch) {
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

  private getConnectorIndex(connector: Connector) {
    return this._connectors.indexOf(connector);
  }

  private removeConnector(connector: Connector) {
    this._connectors.splice(this.getConnectorIndex(connector), 1);
  }

  /**
   * Registers a bean.
   * @throws IdentifierAlreadyExistsError if the identifier is already in use.
   * @param bean
   * @private
   */
  private registerBean(bean: Bean) {
    if (this.haveBean({ identifier: bean.identifier })) {
      throw new IdentifierAlreadyExistsError(bean.identifier);
    }
    this._beans.push(bean);
  }

  // ===== Bean Declaration =====
  /**
   * Declares an already existing value as a dependency.
   * @throws IdentifierAlreadyExistsError if the identifier is already in use.
   * @param identifier
   * @param value
   * @param category
   */
  public declare(
    identifier: BeanIdentifier,
    value: BeanValue,
    category: BeanCategory = BEAN
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

  /**
   * Declares a dependency with a value that needs to be initialized.
   * @throws IdentifierAlreadyExistsError if the identifier is already in use.
   * @param identifier
   * @param initializer a function or class that needs to be initialized to get the final value.
   * @param options category, behaviour (when the initializer needs to be instanced)
   * and wires (selectors for the dependencies that needs to be passed on to the initializer, in correct order).
   */
  public instance(
    identifier: BeanIdentifier,
    initializer: BeanInitializer,
    options: InstanceParameters = {}
  ) {
    const bean = new Bean(
      identifier,
      { initializer: initializer, category: options.category ?? BEAN },
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
    const wires = (bean.options.wiring ?? [])?.map((w) =>
      this.getReadyBean(extractBeanSearch(w))
    );
    return !wires?.some((w) => w === undefined);
  }

  /**
   * Initializes a bean.
   * Removes it if an error occurs.
   * @throws MissingBeanInitializerError if the bean is missing an initializer.
   * @throws BeanNotReadyError if the bean isn't ready.
   * @throws BeanAlreadyInitialized if the bean is already initialized.
   * @throws BeanInitializerNotInstantiable if the bean initializer is neither a function nor a class.
   * @param bean
   * @private
   */
  private initializeBean(bean: Bean) {
    try {
      if (!this.canBeanBeInitialized(bean)) {
        if (!bean.initializer) {
          throw new MissingBeanInitializerError(bean);
        }
        throw new BeanNotReadyError(bean);
      }

      const wiresValues = (bean.options.wiring ?? [])?.map(
        (w) => this.getReadyBean(extractBeanSearch(w))?.value
      );
      bean.initialize(...wiresValues);
    } catch (e) {
      this.removeBean(bean);
      this.emit(ErrorEventId, e as Error);
      throw e;
    }
  }

  // ===== Bean Wiring =====
  /**
   * Returns one or multiple of the requested dependencies.
   * Removes the problematic dependencies.
   * @throws BeanNotFoundError if only one dependency is requested or emits it in the error event if the bean is not present.
   * @throws MissingBeanInitializerError if only one dependency is requested or emits it in the error event if the bean is missing an initializer.
   * @throws BeanNotReadyError if only one dependency is requested or emits it in the error event if the bean isn't ready.
   * @throws BeanAlreadyInitialized if only one dependency is requested or emits it in the error event if the bean is already initialized.
   * @throws BeanInitializerNotInstantiable if only one dependency is requested or emits it in the error event if the bean initializer is neither a function nor a class.
   * @param search identifier or identifier, category and getFirst
   * (whether we should get the first one in case of multiple corresponding dependencies).
   */
  public wire<T = any>(search: BeanIdentifier | BeanSearch): T {
    const searchOptions = extractBeanSearch(search);
    const multiple = !searchOptions.identifier && !searchOptions.getFirst;
    if (!multiple) {
      return this.wireSingleBean(searchOptions).value as T;
    } else {
      return this.wireMultipleBeans(searchOptions).map(
        (bean) => bean.value
      ) as T;
    }
  }

  /**
   * Returns one (the first in case of multiple) of the requested dependencies.
   * Removes the problematic dependencies.
   * @throws BeanNotFoundError if the bean is not present.
   * @throws MissingBeanInitializerError if the bean is missing an initializer.
   * @throws BeanNotReadyError if the bean isn't ready.
   * @throws BeanAlreadyInitialized if the bean is already initialized.
   * @throws BeanInitializerNotInstantiable if the bean initializer is neither a function nor a class.
   * @param beanSearch identifier, category and getFirst
   * (whether we should get the first one in case of multiple corresponding dependencies).
   * @private
   */
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

  /**
   * Returns the requested dependencies.
   * Removes the problematic dependencies.
   * Emits a **BeanNotFoundError** in the error event if the bean is not present.
   * Emits a **MissingBeanInitializerError** in the error event if the bean is missing an initializer.
   * Emits a **BeanNotReadyError** in the error event if the bean isn't ready.
   * Emits a **BeanAlreadyInitialized** in the error event if the bean is already initialized.
   * Emits a **BeanInitializerNotInstantiable** in the error event if the bean initializer is neither a function nor a class.
   * @param beanSearch identifier, category and getFirst.
   * @private
   */
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

  /**
   * Sends one or multiple of the requested dependencies in the provided callback when theses are ready.
   * @param search identifier or identifier, category and getFirst
   * (whether we should get the first one in case of multiple corresponding dependencies).
   * @param callback function that accepts the dependency values as parameter.
   */
  public autoWire<T = any>(
    search: BeanIdentifier | BeanSearch,
    callback: ConnectorCallback<T>
  ) {
    this._connectors.push({
      ...extractBeanSearch(search),
      callback: callback,
    });
    this.resolveConnectors();
    try {
      return this.wire(search) as T;
    } catch (e) {
      /* empty */
    }
    return undefined as T;
  }

  // ===== Resolvers =====
  /**
   * Resolves the unready dependencies that are referring to themselves as dependency.
   * Emits a **SelfDependencyError** in the error event and removes them when that is the case.
   * @private
   */
  private resolveSelfDependencies() {
    this.getUnreadyBeans()
      .filter((bean) => bean.options.wiring?.includes(bean.identifier))
      .forEach((bean) => {
        this.removeBean(bean);
        this.emit(ErrorEventId, new SelfDependencyError(bean));
      });
  }

  /**
   * Resolves interlocking dependencies in the unready dependencies.
   * Emits a **InterDependencyError** in the error event and removes them when that is the case.
   * @private
   */
  private resolveInterDependencies() {
    this.getInterDependentCouples().forEach((couple) => {
      this.removeBeans(couple);
      this.emit(ErrorEventId, new InterDependencyError(couple));
    });
  }

  /**
   * Returns unique couples of interlocking dependencies in the unready dependencies.
   * @private
   */
  private getInterDependentCouples() {
    const initializeBeans = this.getUnreadyBeans();
    const interDependantCouples = initializeBeans
      .flatMap((bean1) => {
        const wireBeans = (bean1.options.wiring ?? [])
          ?.map((w) => this.getUnreadyBean(extractBeanSearch(w)))
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

  /**
   * Check whether beans dependencies are interlocking.
   * @param bean1
   * @param bean2
   * @private
   */
  private areInterDependent(bean1: Bean, bean2: Bean) {
    return (
      (bean1.options.wiring ?? []).includes(bean2.identifier) &&
      (bean2.options.wiring ?? []).includes(bean1.identifier)
    );
  }

  /**
   * Resolves the bean eventual problems, manage them according to their behaviours, then resolves corresponding connectors.
   * @private
   */
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

  /**
   * Resolves connectors that meet the requirements, runs their callback and removes them from the list.
   * @private
   */
  private resolveConnectors() {
    this._connectors.forEach((connector) => {
      try {
        const value = this.wire(connector);
        connector.callback(value);
        this.removeConnector(connector);
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
