import Bean from '../../Bean';
import DependencyError from './DependencyError';

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
