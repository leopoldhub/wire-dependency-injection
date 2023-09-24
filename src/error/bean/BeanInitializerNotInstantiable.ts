import Bean from '../../Bean.js';
import BeanError from './BeanError.js';

export default class BeanInitializerNotInstantiable extends BeanError {
  public constructor(bean: Bean) {
    super(
      [bean],
      `This bean's initializer is not instantiable: ${JSON.stringify(
        bean.identifier
      )}`
    );
  }
}
