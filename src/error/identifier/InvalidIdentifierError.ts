import IdentifierError from './IdentifierError.js';

export default class InvalidIdentifierError extends IdentifierError {
  public constructor(identifier?: string) {
    super(
      identifier,
      `This is not a valid identifier: ${JSON.stringify(identifier)}`
    );
  }
}
