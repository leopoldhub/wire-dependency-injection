import { BeanType, ContainerIdType } from './types.js';
import Container from './Container.js';
import DependencyInjector from './DependencyInjector.js';

export const DEFAULT_BEAN_TYPE: BeanType = 'bean';

export const DEFAULT_CONTAINER_ID: ContainerIdType = 'default';

export const defaultContainer = new Container(DEFAULT_CONTAINER_ID);

const injector = new DependencyInjector();

export default injector;

export { default as AbstractDependencyInjectionError } from './errors/AbstractDependencyInjectionError.js';
export { default as ContainerAlreadyRegisteredError } from './errors/ContainerAlreadyRegisteredError.js';
export { default as ContainerNotFoundError } from './errors/ContainerNotFoundError.js';
export { default as DependencyAlreadyRegisteredError } from './errors/DependencyAlreadyRegisteredError.js';
export { default as DependencyNotFoundError } from './errors/DependencyNotFoundError.js';

export { default as AutoWiredQueueElement } from './AutoWiredQueueElement.js';
export { default as Bean } from './Bean.js';
export { default as Container } from './Container.js';
export { default as DependencyInjector } from './DependencyInjector.js';

export * from './types.js';
