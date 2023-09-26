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
  private readonly _beans: Array<Bean> = [];
  private readonly _connectors: Array<Connector> = [];

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
  private _registerBean(bean: Bean) {
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
      { behaviour: options.behaviour ?? CAUTIOUS, wiring: options.wiring }
    );
    this._registerBean(bean);
  }

  // ===== Bean Initialization =====
  private _canBeanBeInitialized(bean: Bean): boolean {
    if (bean.isReady()) {
      return false;
    }
    const wires = (bean.options.wiring ?? [])
      ?.map((w) => extractBeanSearch(w))
      .filter((w) => w.identifier)
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
  private _initializeBean(bean: Bean, parents: Array<Bean> = []) {
    if (!this._canBeanBeInitialized(bean)) {
      throw new BeanNotReadyError(bean);
    }
    const wiresValues = (bean.options.wiring ?? [])
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
  private _wire<T = any>(
    search: BeanIdentifier | BeanSearch,
    parents: Array<Bean> = []
  ): T {
    const searchOptions = extractBeanSearch(search);
    const multiple = !searchOptions.identifier && !searchOptions.getFirst;
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
  private _wireSingleBean(beanSearch: BeanSearch, parents: Array<Bean> = []) {
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
  private _wireMultipleBeans(
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

  // ===== Resolvers =====
  /**
   * Resolves the bean interdependencies.
   * @throws SelfDependencyError
   * @throws InterDependencyError
   * @param bean
   * @private
   */
  private _resolveBeanInterDependencies(bean: Bean) {
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
  private _filterUniqueInterdependencyPaths(
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
      ).sort((a, b) => a.identifier.localeCompare(b.identifier));
      if (!arrayIncludesArrayAsChild(existingPathsBoundaries, boundaries)) {
        existingPathsBoundaries.push(boundaries);
        uniqueArray.push(inderdependencyPath);
      }
    });
    return uniqueArray;
  }

  private _getBeanInterdependencyPaths(
    bean: Bean,
    parentBeans: Array<Bean> = []
  ): Array<Array<Bean>> {
    const indexBeanInParents = parentBeans.indexOf(bean);
    if (indexBeanInParents >= 0) {
      return [parentBeans];
    }
    if (bean.isReady()) {
      return [];
    }
    const paths = (bean.options.wiring ?? [])
      .map((w) => extractBeanSearch(w))
      .map((w) =>
        (w.identifier ? [this._getBean(w)] : this._getBeans(w.category))
          .filter((b) => b !== bean)
          .filter((b) => !parentBeans.includes(b as Bean))
      )
      .flatMap((b) => b as unknown as Bean)
      .filter((b) => b !== undefined)
      .flatMap((b: Bean) =>
        this._getBeanInterdependencyPaths(b, [...parentBeans, bean])
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
  private _resolveBeans() {
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
  private _resolveConnectors() {
    this._connectors.forEach((connector) => {
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
  private _getReadyBeans(category?: BeanCategory) {
    return this._beans.filter(
      (b) => b.isReady() && (!category || b.category === category)
    );
  }

  private _getReadyBean(search: BeanSearch) {
    return this._getReadyBeans(search.category).find(
      (b) => !search.identifier || b.identifier === search.identifier
    );
  }

  private _getUnreadyBeans(category?: BeanCategory) {
    return this._beans.filter(
      (b) => !b.isReady() && (!category || b.category === category)
    );
  }

  private _getUnreadyBean(search: BeanSearch) {
    return this._getUnreadyBeans(search.category).find(
      (b) => !search.identifier || b.identifier === search.identifier
    );
  }

  private _getBeans(category?: BeanCategory) {
    return this._beans.filter((b) => !category || b.category === category);
  }

  private _getBean(search: BeanSearch) {
    return this._getBeans(search.category).find(
      (bean) => !search.identifier || bean.identifier === search.identifier
    );
  }

  private _haveBean(search: BeanSearch) {
    return !!this._getBean(search);
  }

  private _getBeanIndex(bean: Bean) {
    return this._beans.indexOf(bean);
  }

  private _removeBeans(beans: Array<Bean>) {
    beans.forEach((bean) => this._removeBean(bean));
  }

  private _removeBean(bean: Bean) {
    this._beans.splice(this._getBeanIndex(bean), 1);
  }

  private _getConnectorIndex(connector: Connector) {
    return this._connectors.indexOf(connector);
  }

  private _removeConnector(connector: Connector) {
    this._connectors.splice(this._getConnectorIndex(connector), 1);
  }
}

export default DependencyManager;
