import { BeanType, ClassType } from './types.js';
import { DEFAULT_BEAN_TYPE } from './index.js';

export default class Bean<T extends ClassType = ClassType> {
  private instance!: InstanceType<T>;

  public constructor(
    private readonly id: string,
    private readonly clazz: T,
    private readonly type: BeanType = DEFAULT_BEAN_TYPE
  ) {}

  public getId() {
    return this.id;
  }

  public getClazz() {
    return this.clazz;
  }

  public getType() {
    return this.type;
  }

  public setInstance(instance: InstanceType<T>) {
    this.instance = instance;
  }

  public getInstance() {
    return this.instance;
  }
}
