import IdentifierError from './IdentifierError.js';

export default class IdentifierAlreadyExistsError extends IdentifierError {
  public constructor(identifier?: string) {
    super(
      identifier,
      `This identifier is already taken: ${JSON.stringify(identifier)}`
    );
  }
}
