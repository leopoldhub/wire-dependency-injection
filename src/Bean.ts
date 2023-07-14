import { BeanType, ClassType } from './types.js';
import { DEFAULT_BEAN_TYPE } from './index.js';

/**
 * Beans contains all information needed to manage dependencies
 *
 * @example
 * class MyService { ... }
 * const myServiceBean = new Bean('myService', MyService);
 * // You can instance the bean yourself if you need to
 * myServiceBean.setInstance(new MyService());
 * injector.registerCookedBean(myServiceBean);
 */
export default class Bean<T extends ClassType = ClassType> {
  protected instance!: InstanceType<T>;

  /**
   * Constructs a new instance of the Bean class.
   * @param id - The ID of the bean.
   * @param clazz - The class of the bean.
   * @param type - The type of the bean.
   */
  public constructor(
    protected readonly id: string,
    protected readonly clazz: T,
    protected readonly type: BeanType = DEFAULT_BEAN_TYPE
  ) {}

  /**
   * Gets the ID of the bean.
   * @returns The ID of the bean.
   */
  public getId() {
    return this.id;
  }

  /**
   * Gets the class of the bean.
   * @returns The class of the bean.
   */
  public getClazz() {
    return this.clazz;
  }

  /**
   * Gets the type of the bean.
   * @returns The type of the bean.
   */
  public getType() {
    return this.type;
  }

  /**
   * Sets the instance of the bean.
   * @param instance - The instance of the bean.
   */
  public setInstance(instance: InstanceType<T>) {
    this.instance = instance;
  }

  /**
   * Gets the instance of the bean.
   * @returns The instance of the bean.
   */
  public getInstance() {
    return this.instance;
  }

  /**
   * Instantiates the bean if it's not already instantiated.
   */
  public instantiate() {
    if (this.getInstance() === undefined) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.setInstance(new (this.getClazz())());
    }
  }
}
