import IdentifierError from './IdentifierError.js';

export default class IdentifierNotFoundError extends IdentifierError {
  public constructor(identifier?: string) {
    super(
      identifier,
      `No bean found with this identifier: ${JSON.stringify(identifier)}`
    );
  }
}
