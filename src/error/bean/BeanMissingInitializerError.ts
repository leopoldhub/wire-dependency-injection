import Bean from '../../Bean.js';
import BeanError from './BeanError.js';

export default class BeanMissingInitializerError extends BeanError {
  public constructor(bean: Bean, options?: ErrorOptions) {
    super(
      bean,
      `This bean does not have an initializer: ${JSON.stringify(
        bean.identifier
      )}`,
      options
    );
  }
}
