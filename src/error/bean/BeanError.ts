import Bean from '../../Bean.js';
import DependencyInjectionError from '../DependencyInjectionError.js';

export default class BeanError extends DependencyInjectionError {
  public readonly beans: Array<Bean>;

  public constructor(beans: Array<Bean>, message?: string) {
    super(message);
    this.beans = beans;
  }
}
