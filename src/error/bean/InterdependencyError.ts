import Bean from '../../Bean.js';
import { Couple } from '../../types.js';
import BeanError from './BeanError.js';

export default class InterdependencyError extends BeanError {
  public constructor(beans: Couple<Bean>) {
    super(
      beans,
      `Interdependency have been detected in the declaration of the following pair of beans: ${JSON.stringify(
        beans.map((bean) => bean.identifier)
      )}`
    );
  }
}
