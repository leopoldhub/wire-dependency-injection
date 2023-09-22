import DependencyInjectionError from '../DependencyInjectionError.js';

export default class IdentifierError extends DependencyInjectionError {
  public readonly identifier?: string;

  public constructor(identifier?: string, message?: string) {
    super(message);
    this.identifier = identifier;
  }
}
