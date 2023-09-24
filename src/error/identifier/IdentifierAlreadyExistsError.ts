import IdentifierError from './IdentifierError.js';
import { BeanIdentifier } from '../../types.js';

export default class IdentifierAlreadyExistsError extends IdentifierError {
  public constructor(identifier?: BeanIdentifier) {
    super(
      identifier,
      `This identifier is already taken: ${JSON.stringify(identifier)}`
    );
  }
}
