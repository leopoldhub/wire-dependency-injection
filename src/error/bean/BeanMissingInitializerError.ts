import Bean from '../../Bean';
import BeanError from './BeanError';

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
