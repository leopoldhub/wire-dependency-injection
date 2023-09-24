import Bean from '../../Bean.js';
import BeanError from './BeanError.js';

export default class SelfDependencyError extends BeanError {
  public constructor(bean: Bean) {
    super(
      [bean],
      `The following bean is referencing itself in its dependencies: ${JSON.stringify(
        bean.identifier
      )}`
    );
  }
}
