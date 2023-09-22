import Bean from '../Bean.js';
import DependencyInjectionError from './DependencyInjectionError.js';

export default class MissingDependenciesError extends DependencyInjectionError {
  public readonly bean: Bean;
  public readonly dependencies: Array<string>;

  public constructor(bean: Bean, dependencies: Array<string>) {
    super(
      `This bean: (${JSON.stringify(
        bean.identifier
      )}) is missing the following dependencies: ${JSON.stringify(
        dependencies
      )}`
    );
    this.bean = bean;
    this.dependencies = dependencies;
  }
}
