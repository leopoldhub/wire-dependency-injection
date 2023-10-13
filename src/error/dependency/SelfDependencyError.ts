import Bean from '../../Bean.js';
import DependencyError from './DependencyError.js';

export default class SelfDependencyError extends DependencyError {
  public constructor(
    public readonly bean: Bean,
    options?: ErrorOptions
  ) {
    super(
      `The following bean is referencing itself in its dependencies: ${JSON.stringify(
        bean.identifier
      )}`,
      options
    );
  }
}
