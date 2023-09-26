import Bean from '../../Bean';
import BeanError from './BeanError';

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
