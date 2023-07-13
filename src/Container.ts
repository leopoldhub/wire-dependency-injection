import { BeanType, ClassType, ContainerId } from './types.js';
import Bean from './Bean.js';
import DependencyAlreadyRegisteredError from './errors/DependencyAlreadyRegisteredError.js';

export default class Container {
  public constructor(
    private readonly id: ContainerId,
    private readonly beans: Array<Bean> = []
  ) {}

  public getId() {
    return this.id;
  }

  public getBeans() {
    return this.beans;
  }

  public haveBean(id: string) {
    return this.beans.some((bean) => bean.getId() === id);
  }

  public getBean(id: string) {
    return this.beans.find((bean) => bean.getId() === id);
  }

  public instantiateBean(bean: Bean) {
    if (bean.getInstance() === undefined) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      bean.setInstance(new (bean.getClazz())());
    }
  }

  public registerCookedBean(bean: Bean) {
    if (this.haveBean(bean.getId())) {
      throw new DependencyAlreadyRegisteredError(bean.getId());
    }
    this.instantiateBean(bean);
    this.beans.push(bean);
    return bean;
  }

  public registerRawBean(id: string, clazz: ClassType, type?: BeanType) {
    const bean = new Bean(id, clazz, type);
    return this.registerCookedBean(bean);
  }
}
