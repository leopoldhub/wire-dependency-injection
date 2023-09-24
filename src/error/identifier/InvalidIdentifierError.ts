import IdentifierError from './IdentifierError.js';
import { BeanIdentifier } from '../../types.js';

export default class InvalidIdentifierError extends IdentifierError {
  public constructor(identifier?: BeanIdentifier) {
    super(
      identifier,
      `This is not a valid identifier: ${JSON.stringify(identifier)}`
    );
  }
}
