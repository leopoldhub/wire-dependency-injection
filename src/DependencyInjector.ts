import {
  AutowiredDescriptor,
  BeanType,
  ClassType,
  ContainerIdType,
} from './types.js';
import {
  DEFAULT_BEAN_TYPE,
  DEFAULT_CONTAINER_ID,
  defaultContainer,
} from './index.js';
import Container from './Container.js';
import ContainerAlreadyRegisteredError from './errors/ContainerAlreadyRegisteredError.js';
import ContainerNotFoundError from './errors/ContainerNotFoundError.js';
import Bean from './Bean.js';
import DependencyNotFoundError from './errors/DependencyNotFoundError.js';
import AutoWireQueueElement from './AutoWiredQueueElement.js';

/**
 * The main instance of the library.
 *
 * @example
 * // To register a bean, use the `registerBean` function by providing at least the id and the Class
 * class MyService { ... }
 * injector.registerBean('myService', MyService);
 *
 * // To connect to a bean when this one is registered use the `wire` function.
 * const myService = injector.wire('myService');
 *
 * // To AutoWire (connect to a bean that may not have been registered yet) use the `autoWire` function.
 * class MyController {
 *     private myService = injector.autoWire('myService', (b) => this.myService = b)
 * }
 * // Please note that the autoWire function does not wait for the bean to be registered
 * // the value will be `undefined` until replaced by the correct instance.
 * // The anonymous function `(b) => this.myService = b` is necessary to allow the variable
 * // `this.myService` to be replaced by the correct value later.
 */
export default class DependencyInjector {
  protected readonly autoWireQueue: Array<AutoWireQueueElement> = [];

  /**
   * Constructs a new instance of the DependencyInjector class.
   * @param containers - The array of containers to use for dependency injection.
   */
  public constructor(
    protected readonly containers: Array<Container> = [defaultContainer]
  ) {}

  /**
   * Try to resolve the pending AutoWires in the queue.
   * @internal
   */
  protected executeAutoWireQueue() {
    const queue = this.autoWireQueue.splice(0, this.autoWireQueue.length);
    const remainingQueue: Array<AutoWireQueueElement> = [];
    for (const queueElement of queue) {
      try {
        queueElement.getDescriptor()(
          this.wire(
            queueElement.getBeanId(),
            queueElement.getContainerId()
          ) as undefined
        );
      } catch (e) {
        remainingQueue.push(queueElement);
      }
    }
    this.autoWireQueue.push(...remainingQueue);
  }

  /**
   * Gets the array of containers used for dependency injection.
   * @returns The array of containers.
   */
  public getContainers() {
    return this.containers;
  }

  /**
   * Checks if a container with the specified ID exists.
   * @param id - The ID of the container to check.
   * @returns `true` if the container exists, `false` otherwise.
   */
  public haveContainer(id: ContainerIdType) {
    return this.containers.some((container) => container.getId() === id);
  }

  /**
   * Gets the container with the specified ID.
   * @param id - The ID of the container to retrieve.
   * @returns The container with the specified ID.
   * @throws ContainerNotFoundError if the specified container does not exist.
   */
  public getContainer(id: ContainerIdType = DEFAULT_CONTAINER_ID) {
    if (!this.haveContainer(id)) {
      throw new ContainerNotFoundError();
    }
    return this.containers.find((container) => container.getId() === id);
  }

  /**
   * Registers an already instantiated container.
   * @param container - The container to register.
   * @returns The registered container.
   * @throws ContainerAlreadyRegisteredError if a container with the same ID is already registered.
   */
  public registerCookedContainer(container: Container) {
    if (this.haveContainer(container.getId())) {
      throw new ContainerAlreadyRegisteredError();
    }
    this.containers.push(container);
    return container;
  }

  /**
   * Registers a new container with the specified ID.
   * @param id - The ID of the container to register.
   * @returns The registered container.
   * @throws ContainerAlreadyRegisteredError if a container with the same ID is already registered.
   */
  public registerRawContainer(id: ContainerIdType) {
    const container = new Container(id);
    return this.registerCookedContainer(container);
  }

  /**
   * Checks if a bean with the specified ID exists in the specified container.
   * @param id - The ID of the bean to check.
   * @param containerId - The ID of the container to check.
   * @returns `true` if the bean exists, `false` otherwise.
   */
  public haveBean(id: string, containerId: string = DEFAULT_CONTAINER_ID) {
    if (!this.haveContainer(containerId)) {
      return undefined;
    }
    return this.getContainer(containerId)?.haveBean(id);
  }

  /**
   * Gets the bean with the specified ID from the specified container.
   * @param id - The ID of the bean to retrieve.
   * @param containerId - The ID of the container to retrieve the bean from.
   * @returns The bean instance.
   * @throws ContainerNotFoundError if the specified container does not exist.
   * @throws DependencyNotFoundError if the specified bean does not exist in the container.
   */
  public getBean(id: string, containerId: string = DEFAULT_CONTAINER_ID) {
    if (!this.haveContainer(containerId)) {
      throw new ContainerNotFoundError();
    }
    return this.getContainer(containerId)?.getBean(id);
  }

  /**
   * Register an already instantiated bean in the specified container.
   *
   * Pending AutoWires will be automatically resolved.
   * @example
   * class MyService { ... }
   * const myServiceBean = new Bean('myService', MyService);
   * // You can instantiate the bean yourself if you need to.
   * myServiceBean.setInstance(new MyService());
   * injector.registerCookedBean(myServiceBean);
   * @param bean - The bean to register.
   * @param containerId - The ID of the container to register the bean in.
   * @returns The registered bean.
   * @throws ContainerNotFoundError if the specified container does not exist.
   */
  public registerCookedBean(
    bean: Bean,
    containerId: string = DEFAULT_CONTAINER_ID
  ) {
    const container = this.getContainer(containerId);
    if (!container) {
      throw new ContainerNotFoundError();
    }
    const retBean = container.registerCookedBean(bean);
    this.executeAutoWireQueue();
    return retBean;
  }

  /**
   * Register a new bean with its id, class, and type in the specified container.
   *
   * Pending AutoWires will be automatically resolved.
   * @example
   * // Please note that the only argument passed to the class constructor when auto-instancing is the bean itself.
   * class MyService {
   *     public constructor(bean) {
   *         console.log("Im "+bean.getId());
   *     }
   * }
   * injector.registerBean('myService', MyService);
   * @param id - The ID of the bean to register.
   * @param clazz - The class of the bean to register.
   * @param type - The type of the bean.
   * @param containerId - The ID of the container to register the bean in.
   * @returns The registered bean.
   * @throws ContainerNotFoundError if the specified container does not exist.
   */
  public registerBean(
    id: string,
    clazz: ClassType,
    type: BeanType = DEFAULT_BEAN_TYPE,
    containerId: string = DEFAULT_CONTAINER_ID
  ) {
    const container = this.getContainer(containerId);
    if (!container) {
      throw new ContainerNotFoundError();
    }
    const retBean = container.registerRawBean(id, clazz, type);
    this.executeAutoWireQueue();
    return retBean;
  }

  /**
   * Try to wire to a bean, if not found, will pass the bean in the descriptor when later registered.
   * @example
   * class MyController {
   *     private myService = injector.autoWire('myService', (b) => this.myService = b)
   * }
   * // Please note that the autoWire function does not wait for the bean to be registered
   * // the value will be `undefined` until replaced by the correct instance.
   * // The anonymous function `(b) => this.myService = b` is necessary to allow the variable
   * // `this.myService` to be replaced by the correct value later.
   * @param id - The ID of the bean to AutoWire.
   * @param descriptor - The autowired descriptor function.
   * @param containerId - The ID of the container to retrieve the bean from.
   * @returns The autowired instance, or `undefined` if the bean is not found.
   */
  public autoWire(
    id: string,
    descriptor: AutowiredDescriptor,
    containerId: string = DEFAULT_CONTAINER_ID
  ) {
    if (this.haveBean(id, containerId)) {
      const instance = this.wire(id, containerId);
      descriptor(instance as undefined);
      return instance as undefined;
    }
    this.autoWireQueue.push(
      new AutoWireQueueElement(id, containerId, descriptor)
    );
    return undefined;
  }

  /**
   * Try to get a bean instance by its id (and its container id if provided).
   * Will throw an error if the container or the bean are nor registered.
   * @param id - The ID of the bean to wire.
   * @param containerId - The ID of the container to retrieve the bean from.
   * @returns The wired instance of the bean.
   * @throws ContainerNotFoundError if the specified container does not exist.
   * @throws DependencyNotFoundError if the specified bean does not exist in the container.
   */
  public wire(id: string, containerId: string = DEFAULT_CONTAINER_ID) {
    const bean = this.getBean(id, containerId);
    if (!bean) {
      throw new DependencyNotFoundError();
    }
    return bean.getInstance();
  }
}
