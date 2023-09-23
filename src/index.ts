import DependencyManager from './DependencyManager.js';

export * from './types.js';

export * from './DependencyManager.js';
export * from './Bean.js';
export * as beanBehaviours from './beanBehaviours.js';
export * from './beanBehaviours.js';

export * from './error/DependencyInjectionError.js';
export * from './error/bean/BeanError.js';
export * from './error/bean/InterDependencyError.js';
export * from './error/bean/SelfDependencyError.js';
export * from './error/bean/BeanNotReadyError.js';
export * from './error/bean/MissingBeanInitializerError.js';
export * from './error/bean/BeanInitializerNotInstantiable.js';
export * from './error/bean/BeanAlreadyInitialized.js';
export * from './error/identifier/IdentifierError.js';
export * from './error/identifier/IdentifierAlreadyExistsError.js';
export * from './error/identifier/IdentifierNotFoundError.js';
export * from './error/identifier/InvalidIdentifierError.js';
export * from './error/MissingDependenciesError.js';

export * as utils from './utils.js';

export default new DependencyManager();
