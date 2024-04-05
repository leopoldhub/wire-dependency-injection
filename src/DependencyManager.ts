import EventEmitter from 'events';
import Bean from './Bean.js';
import IdentifierAlreadyExistsError from './error/management/identifier/IdentifierAlreadyExistsError.js';
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
  WireBeanSearch,
} from './types.js';
import BeanMissingInitializerError from './error/bean/BeanMissingInitializerError.js';
import BeanNotFoundError from './error/management/BeanNotFoundError.js';
import BeanNotReadyError from './error/bean/BeanNotReadyError.js';
import InterDependencyError from './error/dependency/InterDependencyError.js';
import DependencyInjectionError from './error/DependencyInjectionError.js';
import SelfDependencyError from './error/dependency/SelfDependencyError.js';
import { arrayIncludesArrayAsChild, extractBeanSearch } from './utils.js';
import { BEAN } from './beanCategories.js';
import ConnectorCallbackError from './error/connector/ConnectorCallbackError.js';

export const ErrorEventId = 'error';

export const DEFAULT_ERROR_HANDLER = console.error;

/**
 * A DependencyManager controls, registers, wires and distributes dependencies.
 */
export class DependencyManager extends EventEmitter {
  protected readonly _beans: Array<Bean> = [];
  protected readonly _connectors: Array<Connector> = [];

  public constructor() {
    super({ captureRejections: true });
    this.on(ErrorEventId, DEFAULT_ERROR_HANDLER);
  }

  /**
   * Registers a bean.
   * @throws IdentifierAlreadyExistsError
   * @throws BeanMissingInitializerError
   * @throws SelfDependencyError
   * @throws InterDependencyError
   * @emits 'error' ConnectorCallbackError
   * @param bean
   * @private
   */
  protected _registerBean(bean: Bean) {
    if (this._haveBean({ identifier: bean.identifier })) {
      throw new IdentifierAlreadyExistsError(bean.identifier);
    }
    if (bean.options.behaviour !== NO_INSTANCE && !bean.initializer) {
      throw new BeanMissingInitializerError(bean);
    }
    this._beans.push(bean);
    this._resolveBeanInterDependencies(bean);
    this._resolveBeans();
    this._resolveConnectors();
  }

  // ===== Bean Declaration =====
  /**
   * Declares an already existing value as a dependency.
   * @throws IdentifierAlreadyExistsError
   * @throws BeanMissingInitializerError
   * @throws SelfDependencyError
   * @throws InterDependencyError
   * @throws ConnectorCallbackError
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
    this._registerBean(bean);
  }

  /**
   * Declares a dependency with a value that needs to be initialized.
   * @throws IdentifierAlreadyExistsError
   * @throws BeanMissingInitializerError
   * @throws SelfDependencyError
   * @throws InterDependencyError
   * @throws ConnectorCallbackError
   * @param identifier
   * @param initializer
   * @param options
   */
  public instance(
    identifier: BeanIdentifier,
    initializer: BeanInitializer,
    options: InstanceParameters = {}
  ) {
    const bean = new Bean(
      identifier,
      { initializer: initializer, category: options.category ?? BEAN },
      { behaviour: options?.behaviour ?? CAUTIOUS, wiring: options?.wiring }
    );
    this._registerBean(bean);
  }

  // ===== Bean Initialization =====
  protected _canBeanBeInitialized(bean: Bean): boolean {
    if (bean.isReady()) {
      return false;
    }
    const wires = (bean.options.wiring ?? [])
      ?.map((w) => extractBeanSearch(w))
      .filter((w) => w.identifier !== undefined)
      .map((w) => this._getBean(extractBeanSearch(w)));
    return !wires?.some(
      (bean) =>
        bean === undefined ||
        (!bean.isReady() &&
          (bean.options.behaviour !== LAZY ||
            !this._canBeanBeInitialized(bean)))
    );
  }

  /**
   * Initializes a bean.
   * @throws BeanNotFoundError
   * @throws BeanNotReadyError
   * @throws BeanAlreadyInitializedError
   * @throws BeanInitializerNotInstantiableError
   * @throws BeanInitializationError
   * @emits 'error' BeanNotFoundError
   * @emits 'error' BeanNotReadyError
   * @emits 'error' BeanAlreadyInitializedError
   * @emits 'error' BeanInitializerNotInstantiableError
   * @emits 'error' BeanInitializationError
   * @param bean
   * @param parents
   * @private
   */
  protected _initializeBean(bean: Bean, parents: Array<Bean> = []) {
    if (!this._canBeanBeInitialized(bean)) {
      throw new BeanNotReadyError(bean);
    }
    const wiresValues = (bean.options.wiring ?? [])
      .filter((w) => !(w as WireBeanSearch)?.nonTransferable)
      ?.map((w) => extractBeanSearch(w))
      .map((w) => this._wire(w, [...parents, bean]));
    bean.initialize(...wiresValues);
  }

  // ===== Bean Wiring =====
  /**
   * Returns one or multiple of the requested dependencies.
   * @throws BeanNotReadyError
   * @throws BeanAlreadyInitializedError
   * @throws BeanInitializerNotInstantiableError
   * @throws BeanInitializationError
   * @emits 'error' BeanNotFoundError
   * @emits 'error' BeanNotReadyError
   * @emits 'error' BeanAlreadyInitializedError
   * @emits 'error' BeanInitializerNotInstantiableError
   * @emits 'error' BeanInitializationError
   * @param search
   */
  public wire<T = any>(search: BeanIdentifier | BeanSearch): T {
    try {
      return this._wire(search);
    } catch (e) {
      const bean = this._getBean(extractBeanSearch(search));
      if (bean) {
        this._removeBean(bean);
      }
      this.emit(ErrorEventId, e as Error);
      throw e;
    }
  }

  /**
   * Returns one or multiple of the requested dependencies.
   * @throws BeanNotReadyError
   * @throws BeanAlreadyInitializedError
   * @throws BeanInitializerNotInstantiableError
   * @throws BeanInitializationError
   * @param search
   * @param parents
   * @private
   */
  protected _wire<T = any>(
    search: BeanIdentifier | BeanSearch,
    parents: Array<Bean> = []
  ): T {
    const searchOptions = extractBeanSearch(search);
    const multiple =
      searchOptions.identifier === undefined && !searchOptions.getFirst;
    if (!multiple) {
      return this._wireSingleBean(searchOptions, parents).value as T;
    } else {
      return this._wireMultipleBeans(searchOptions, parents).map(
        (bean) => bean.value,
        parents
      ) as T;
    }
  }

  /**
   * Returns the requested dependencies.
   * @throws BeanNotFoundError
   * @throws BeanNotReadyError
   * @throws BeanAlreadyInitializedError
   * @throws BeanInitializerNotInstantiableError
   * @throws BeanInitializationError
   * @param beanSearch
   * @param parents
   * @private
   */
  protected _wireSingleBean(beanSearch: BeanSearch, parents: Array<Bean> = []) {
    const bean = this._getBean(beanSearch);
    if (!bean) {
      throw new BeanNotFoundError(beanSearch.identifier, beanSearch.category);
    }
    if (!bean.isReady() && bean.options.behaviour !== LAZY) {
      throw new BeanNotReadyError(bean);
    }
    if (!bean.isReady()) {
      this._initializeBean(bean, parents);
    }
    return bean;
  }

  /**
   * Returns the requested dependencies.
   * @emits 'error' BeanNotFoundError
   * @emits 'error' BeanNotReadyError
   * @emits 'error' BeanAlreadyInitializedError
   * @emits 'error' BeanInitializerNotInstantiableError
   * @emits 'error' BeanInitializationError
   * @param beanSearch identifier, category and getFirst.
   * @param parents
   * @private
   */
  protected _wireMultipleBeans(
    beanSearch: BeanSearch,
    parents: Array<Bean> = []
  ) {
    this._getUnreadyBeans(beanSearch.category).forEach((bean) => {
      try {
        if (
          !bean.isReady() &&
          bean.options.behaviour === LAZY &&
          !parents.includes(bean)
        ) {
          this._initializeBean(bean, parents);
        }
      } catch (e) {
        /* empty */
      }
    });
    return this._getReadyBeans(beanSearch.category);
  }

  /**
   * Sends one or multiple of the requested dependencies in the provided callback when theses are ready.
   * @emits 'error' BeanNotFoundError
   * @emits 'error' BeanNotReadyError
   * @emits 'error' BeanAlreadyInitializedError
   * @emits 'error' BeanInitializerNotInstantiableError
   * @emits 'error' BeanInitializationError
   * @emits 'error' ConnectorCallbackError
   * @param search
   * @param callback
   */
  public autoWire<T = any>(
    search: BeanIdentifier | BeanSearch,
    callback: ConnectorCallback<T>
  ): T {
    this._connectors.push({
      ...extractBeanSearch(search),
      callback: callback,
    });
    this._resolveConnectors();
    try {
      return this._wire(search);
    } catch (e) {
      /* empty */
    }
    return undefined as T;
  }

  /**
   * Returns asynchronously one or multiple of the requested dependencies when theses are ready.
   * @emits 'error' BeanNotFoundError
   * @emits 'error' BeanNotReadyError
   * @emits 'error' BeanAlreadyInitializedError
   * @emits 'error' BeanInitializerNotInstantiableError
   * @emits 'error' BeanInitializationError
   * @emits 'error' ConnectorCallbackError
   * @param search
   * @param timeout in ms
   */
  public async asyncWire<T = any>(
    search: BeanIdentifier | BeanSearch,
    timeout?: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      let finished = false;
      this.autoWire<T>(search, (value) => {
        if (!finished) {
          finished = true;
          resolve(value);
        }
      });
      if (!finished && timeout) {
        setTimeout(() => {
          if (!finished) {
            finished = true;
            reject();
          }
        }, timeout);
      }
    });
  }

  // ===== Resolvers =====
  /**
   * Resolves the bean interdependencies.
   * @throws SelfDependencyError
   * @throws InterDependencyError
   * @param bean
   * @private
   */
  protected _resolveBeanInterDependencies(bean: Bean) {
    this._getBeanInterdependencyPaths(bean).forEach((path) => {
      this._removeBean(bean);
      if (path.length === 1) {
        this.emit(ErrorEventId, new SelfDependencyError(path[0]));
      } else {
        this.emit(ErrorEventId, new InterDependencyError(path));
      }
    });
  }

  /**
   * Filters the dependency paths by unique path boundaries.
   * @param interdependencyPaths
   * @private
   */
  protected _filterUniqueInterdependencyPaths(
    interdependencyPaths: Array<Array<Bean>>
  ) {
    const existingPathsBoundaries: Array<Couple<Bean>> = [];
    const uniqueArray: Array<Array<Bean>> = [];
    interdependencyPaths.forEach((inderdependencyPath) => {
      const boundaries = (
        [
          inderdependencyPath[0],
          inderdependencyPath.at(-1) as Bean,
        ] as Couple<Bean>
      ).sort((a, b) =>
        String(a.identifier).localeCompare(String(b.identifier))
      );
      if (!arrayIncludesArrayAsChild(existingPathsBoundaries, boundaries)) {
        existingPathsBoundaries.push(boundaries);
        uniqueArray.push(inderdependencyPath);
      }
    });
    return uniqueArray;
  }

  protected _getBeanInterdependencyPaths(
    bean: Bean,
    parentBeans: Array<Bean> = [],
    isInGroup?: boolean
  ): Array<Array<Bean>> {
    const indexBeanInParents = parentBeans.indexOf(bean);
    if (indexBeanInParents >= 0) {
      if (
        isInGroup &&
        parentBeans[indexBeanInParents].category === bean.category
      ) {
        return [];
      }
      return [parentBeans];
    }
    if (bean.isReady()) {
      return [];
    }
    const paths = (bean.options.wiring ?? [])
      .map((w) => extractBeanSearch(w))
      .map((w) => {
        if (w.identifier !== undefined) {
          return [this._getBean(w)];
        }
        isInGroup = true;
        return this._getBeans(w.category)
          .filter((b) => b !== bean)
          .filter((b) => !parentBeans.includes(b));
      })
      .flatMap((b) => b as unknown as Bean)
      .filter((b) => b !== undefined)
      .flatMap((b: Bean) =>
        this._getBeanInterdependencyPaths(b, [...parentBeans, bean], isInGroup)
      );
    return this._filterUniqueInterdependencyPaths(paths);
  }

  /**
   * Resolves the registered beans.
   * @emits 'error' BeanNotFoundError
   * @emits 'error' BeanNotReadyError
   * @emits 'error' BeanAlreadyInitializedError
   * @emits 'error' BeanInitializerNotInstantiableError
   * @emits 'error' BeanInitializationError
   * @private
   */
  protected _resolveBeans() {
    const unReadyBeans = this._getUnreadyBeans();
    const beansToInitialize = unReadyBeans.filter((b) =>
      [EAGER, CAUTIOUS].includes(b.options.behaviour)
    );
    const solvedSome = beansToInitialize.some((bean) => {
      if (
        !bean.isReady() &&
        (bean.options.behaviour === EAGER || this._canBeanBeInitialized(bean))
      ) {
        try {
          this._initializeBean(bean);
          return true;
        } catch (e) {
          this._removeBean(bean);
          this.emit(ErrorEventId, e as Error);
        }
      }
    });
    if (solvedSome) {
      this._resolveBeans();
    }
  }

  /**
   * Resolves connectors that meet the requirements, runs their callback, then removes them from the list.
   * @emits 'error' ConnectorCallbackError
   * @private
   */
  protected _resolveConnectors() {
    [...this._connectors].forEach((connector) => {
      if (connector.resolved) {
        return;
      }
      const bean = this._getBean(connector);
      if (!bean) {
        return;
      }
      try {
        if (!bean.isReady() && this._canBeanBeInitialized(bean)) {
          this._initializeBean(bean);
        }
      } catch (e) {
        this._removeBean(bean);
        this.emit(ErrorEventId, e as Error);
      }
      if (!bean.isReady()) {
        return;
      }
      try {
        connector.callback(bean.value);
      } catch (e) {
        this.emit(
          ErrorEventId,
          new ConnectorCallbackError(connector, { cause: e })
        );
      }
      connector.resolved = true;
      this._removeConnector(connector);
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

  public removeDefaultErrorHandler() {
    this.removeListener(ErrorEventId, DEFAULT_ERROR_HANDLER);
  }

  // ===== Bean Management =====
  protected _getReadyBeans(category?: BeanCategory) {
    return [...this._beans].filter(
      (b) => b.isReady() && (!category || b.category === category)
    );
  }

  protected _getReadyBean(search: BeanSearch) {
    return this._getReadyBeans(search.category).find(
      (b) =>
        search.identifier === undefined || b.identifier === search.identifier
    );
  }

  protected _getUnreadyBeans(category?: BeanCategory) {
    return [...this._beans].filter(
      (b) => !b.isReady() && (!category || b.category === category)
    );
  }

  protected _getUnreadyBean(search: BeanSearch) {
    return this._getUnreadyBeans(search.category).find(
      (b) =>
        search.identifier === undefined || b.identifier === search.identifier
    );
  }

  protected _getBeans(category?: BeanCategory) {
    return [...this._beans].filter((b) => !category || b.category === category);
  }

  protected _getBean(search: BeanSearch) {
    return this._getBeans(search.category).find(
      (bean) =>
        search.identifier === undefined || bean.identifier === search.identifier
    );
  }

  protected _haveBean(search: BeanSearch) {
    return !!this._getBean(search);
  }

  protected _getBeanIndex(bean: Bean) {
    return this._beans.indexOf(bean);
  }

  protected _removeBeans(beans: Array<Bean>) {
    beans.forEach((bean) => this._removeBean(bean));
  }

  protected _removeBean(bean: Bean) {
    this._beans.splice(this._getBeanIndex(bean), 1);
  }

  protected _getConnectorIndex(connector: Connector) {
    return this._connectors.indexOf(connector);
  }

  protected _removeConnector(connector: Connector) {
    this._connectors.splice(this._getConnectorIndex(connector), 1);
  }
}

export default DependencyManager;
