import Bean from '../../Bean.js';
import BeanError from './BeanError.js';

export default class MissingBeanInitializerError extends BeanError {
  public constructor(bean: Bean) {
    super(
      [bean],
      `This bean does not have an initializer: ${JSON.stringify(
        bean.identifier
      )}`
    );
  }
}
