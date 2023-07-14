import { BeanType, ClassType, ContainerIdType } from './types.js';
import Bean from './Bean.js';
import DependencyAlreadyRegisteredError from './errors/DependencyAlreadyRegisteredError.js';
import DependencyNotFoundError from './errors/DependencyNotFoundError.js';
import { parseId } from './utils.js';

/**
 * Containers holds beans for dependency injection.
 * Beans can have the same ID if isolated in different containers.
 *
 * @example
 * const container1 = new Container(CONTAINER1_ID);
 * const container2 = injector.getContainer(CONTAINER2_ID);
 *
 * container1.registerRawBean('b1', B1);
 * // Will throw an error
 * container1.registerRawBean('b1', B1bis);
 * // Will work
 * container2.registerRawBean('b1', B1ter);
 */
export default class Container {
  /**
   * Constructs a new instance of the Container class.
   * @param id - The ID of the container.
   * @param beans - The array of beans in the container.
   */
  public constructor(
    protected readonly id: ContainerIdType,
    protected readonly beans: Array<Bean> = []
  ) {}

  /**
   * Gets the ID of the container.
   * @returns The ID of the container.
   */
  public getId() {
    return this.id;
  }

  /**
   * Gets the array of beans in the container.
   * @returns The array of beans.
   */
  public getBeans() {
    return this.beans;
  }

  /**
   * Gets the array of beans in the container by their type.
   * @param type - the wanted bean type.
   * @returns The array of beans.
   */
  public getBeansByType(type: BeanType) {
    return this.beans.filter((bean) => bean.getType() === type);
  }

  /**
   * Checks if a bean with the specified ID exists in the container.
   * @param id - The ID of the bean to check.
   * @returns `true` if the bean exists, `false` otherwise.
   */
  public haveBean(id: string | ClassType) {
    const bid = parseId(id);
    return this.beans.some((bean) => bean.getId() === bid);
  }

  /**
   * Gets the bean with the specified ID from the container.
   * @param id - The ID of the bean to retrieve.
   * @returns The bean instance.
   * @throws DependencyNotFoundError if the specified bean does not exist in the container.
   */
  public getBean(id: string | ClassType) {
    const bid = parseId(id);
    if (!this.haveBean(bid)) {
      throw new DependencyNotFoundError();
    }
    return this.beans.find((bean) => bean.getId() === id);
  }

  /**
   * Registers an already instantiated bean in the container.
   * @param bean - The bean to register.
   * @returns The registered bean.
   * @throws DependencyAlreadyRegisteredError if a bean with the same ID is already registered.
   */
  public registerCookedBean(bean: Bean) {
    if (this.haveBean(bean.getId())) {
      throw new DependencyAlreadyRegisteredError(bean.getId());
    }
    bean.instantiate();
    this.beans.push(bean);
    return bean;
  }

  /**
   * Registers a new bean with the specified ID, class, and type in the container.
   * @param clazz - The class of the bean to register.
   * @param id - The ID of the bean to register. Will take the name of the provided class if not provided.
   * @param type - The type of the bean.
   * @returns The registered bean.
   * @throws DependencyAlreadyRegisteredError if a bean with the same ID is already registered.
   */
  public registerRawBean(clazz: ClassType, id?: string, type?: BeanType) {
    const bean = new Bean(clazz, id, type);
    return this.registerCookedBean(bean);
  }
}
