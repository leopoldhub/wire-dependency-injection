import Bean from '../../Bean.js';
import BeanError from './BeanError.js';

export default class BeanAlreadyInitialized extends BeanError {
  public constructor(bean: Bean) {
    super(
      [bean],
      `This bean has already been initialized: ${JSON.stringify(
        bean.identifier
      )}`
    );
  }
}
