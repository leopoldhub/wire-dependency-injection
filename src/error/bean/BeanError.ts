import DependencyInjectionError from '../DependencyInjectionError';
import Bean from '../../Bean';

export default class BeanError extends DependencyInjectionError {
  public constructor(
    public readonly bean: Bean,
    message?: string,
    options?: ErrorOptions
  ) {
    super(message, options);
  }
}
