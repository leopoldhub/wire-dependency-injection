import DependencyInjectionError from '../DependencyInjectionError.js';
import { BeanIdentifier } from '../../types.js';

export default class IdentifierError extends DependencyInjectionError {
  public readonly identifier?: string;

  public constructor(identifier?: BeanIdentifier, message?: string) {
    super(message);
    this.identifier = identifier;
  }
}
