import Bean from '../../Bean.js';
import BeanError from './BeanError.js';

export default class BeanInitializerNotInstantiableError extends BeanError {
  public constructor(bean: Bean, options?: ErrorOptions) {
    super(
      bean,
      `This bean's initializer is not instantiable: ${JSON.stringify(
        bean.identifier
      )}`,
      options
    );
  }
}
