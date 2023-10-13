import Bean from '../../Bean.js';
import DependencyError from './DependencyError.js';

export default class InterDependencyError extends DependencyError {
  public constructor(
    public readonly beans: Array<Bean>,
    options?: ErrorOptions
  ) {
    super(
      `InterDependency have been detected in the declaration of the following pair of beans: ${JSON.stringify(
        [beans[0].identifier, beans.at(-1)?.identifier]
      )}, full path: ${JSON.stringify(beans.map((bean) => bean.identifier))}`,
      options
    );
  }
}
