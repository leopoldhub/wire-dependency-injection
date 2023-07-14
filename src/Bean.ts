import { BeanType, ClassType } from './types.js';
import { DEFAULT_BEAN_TYPE } from './index.js';

/**
 * Beans contains all information needed to manage dependencies
 *
 * @example
 * class MyService {
 *     public constructor(bean) {
 *         // ...
 *     }
 *     // ...
 * }
 * const myServiceBean = new Bean(MyService);
 * // You can also give it a custom ID
 * const myServiceBean = new Bean(MyService);
 * // You can instance the bean yourself if you need to
 * myServiceBean.setInstance(new MyService(myServiceBean));
 * injector.registerCookedBean(myServiceBean);
 */
export default class Bean<T extends ClassType = ClassType> {
  protected instance!: InstanceType<T>;
  protected readonly id: string;

  /**
   * Constructs a new instance of the Bean class.
   * @param clazz - The class of the bean.
   * @param id - The ID of the bean. Will take the name of the provided class if not provided.
   * @param type - The type of the bean.
   */
  public constructor(
    protected readonly clazz: T,
    id?: string,
    protected readonly type: BeanType = DEFAULT_BEAN_TYPE
  ) {
    this.id = id ? id : clazz.name;
  }

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
      this.setInstance(new (this.getClazz())(this));
    }
  }
}
