import Bean from '../Bean.js';
import DependencyInjectionError from './DependencyInjectionError.js';
import { BeanIdentifier } from '../types.js';

export default class MissingDependenciesError extends DependencyInjectionError {
  public readonly bean: Bean;
  public readonly dependencies: Array<BeanIdentifier>;

  public constructor(bean: Bean, dependencies: Array<BeanIdentifier>) {
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
