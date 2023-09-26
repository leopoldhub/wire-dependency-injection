import Bean from '../../Bean';
import BeanError from './BeanError';

export default class BeanNotReadyError extends BeanError {
  public constructor(bean: Bean, options?: ErrorOptions) {
    super(
      bean,
      `This bean is not ready yet: ${JSON.stringify(bean.identifier)}`,
      options
    );
  }
}
