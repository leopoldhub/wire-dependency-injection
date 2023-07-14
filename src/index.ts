import { BeanType, ContainerIdType } from './types.js';
import Container from './Container.js';
import DependencyInjector from './DependencyInjector.js';

export const DEFAULT_BEAN_TYPE: BeanType = 'bean';

export const DEFAULT_CONTAINER_ID: ContainerIdType = 'default';

export const defaultContainer = new Container(DEFAULT_CONTAINER_ID);

const injector = new DependencyInjector();

export default injector;

export * from './errors/AbstractDependencyInjectionError.js';
export * from './errors/ContainerAlreadyRegisteredError.js';
export * from './errors/ContainerNotFoundError.js';
export * from './errors/DependencyAlreadyRegisteredError.js';
export * from './errors/DependencyNotFoundError.js';

export * from './AutoWiredQueueElement.js';
export * from './Bean.js';
export * from './Container.js';
export * from './DependencyInjector.js';

export * from './types.js';
