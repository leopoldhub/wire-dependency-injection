import Bean from '../../Bean';
import BeanError from './BeanError';

export default class BeanInitializationError extends BeanError {
  public constructor(bean: Bean, options?: ErrorOptions) {
    super(
      bean,
      `An error occurred during the bean initialization: ${JSON.stringify(
        bean.identifier
      )}`,
      options
    );
  }
}
