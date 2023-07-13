import {
  AutowiredDescriptor,
  BeanType,
  ClassType,
  ContainerId,
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

export default class DependencyInjector {
  private readonly autoWireQueue: Array<AutoWireQueueElement> = [];

  public constructor(
    private readonly containers: Array<Container> = [defaultContainer]
  ) {}

  public executeAutoWireQueue() {
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

  public getContainers() {
    return this.containers;
  }

  public haveContainer(id: ContainerId) {
    return this.containers.some((container) => container.getId() === id);
  }

  public getContainer(id: ContainerId = DEFAULT_CONTAINER_ID) {
    return this.containers.find((container) => container.getId() === id);
  }

  public registerCookedContainer(container: Container) {
    if (this.haveContainer(container.getId())) {
      throw new ContainerAlreadyRegisteredError();
    }
    this.containers.push(container);
    return container;
  }

  public registerContainer(id: ContainerId) {
    const container = new Container(id);
    return this.registerCookedContainer(container);
  }

  public haveBean(id: string, containerId: string = DEFAULT_CONTAINER_ID) {
    if (!this.haveContainer(containerId)) {
      return undefined;
    }
    return this.getContainer(containerId)?.haveBean(id);
  }

  public getBean(id: string, containerId: string = DEFAULT_CONTAINER_ID) {
    if (!this.haveContainer(containerId)) {
      throw new ContainerNotFoundError();
    }
    return this.getContainer(containerId)?.getBean(id);
  }

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

  public wire(id: string, containerId: string = DEFAULT_CONTAINER_ID) {
    const bean = this.getBean(id, containerId);
    if (!bean) {
      throw new DependencyNotFoundError();
    }
    return bean.getInstance();
  }
}
