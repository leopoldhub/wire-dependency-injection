import Bean from '../../Bean.js';
import BeanError from './BeanError.js';

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
