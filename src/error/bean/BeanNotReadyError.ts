import Bean from '../../Bean.js';
import BeanError from './BeanError.js';

export default class BeanNotReadyError extends BeanError {
  public constructor(bean: Bean, options?: ErrorOptions) {
    super(
      bean,
      `This bean is not ready yet: ${JSON.stringify(bean.identifier)}`,
      options
    );
  }
}
