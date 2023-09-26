import Bean from '../../Bean';
import BeanError from './BeanError';

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
