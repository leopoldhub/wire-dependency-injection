import IdentifierError from './IdentifierError.js';
import { BeanIdentifier } from '../../types.js';

export default class IdentifierNotFoundError extends IdentifierError {
  public constructor(identifier?: BeanIdentifier) {
    super(
      identifier,
      `No bean found with this identifier: ${JSON.stringify(identifier)}`
    );
  }
}
