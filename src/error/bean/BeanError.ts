import DependencyInjectionError from '../DependencyInjectionError.js';
import Bean from '../../Bean.js';

export default class BeanError extends DependencyInjectionError {
  public constructor(
    public readonly bean: Bean,
    message?: string,
    options?: ErrorOptions
  ) {
    super(message, options);
  }
}
