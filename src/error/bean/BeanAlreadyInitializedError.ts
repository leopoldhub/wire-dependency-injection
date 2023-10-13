import Bean from '../../Bean.js';
import BeanError from './BeanError.js';

export default class BeanAlreadyInitializedError extends BeanError {
  public constructor(bean: Bean, options?: ErrorOptions) {
    super(
      bean,
      `This bean has already been initialized: ${JSON.stringify(
        bean.identifier
      )}`,
      options
    );
  }
}
