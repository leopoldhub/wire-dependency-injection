import IdentifierError from './IdentifierError.js';
import { BeanIdentifier } from '../../../types.js';

export default class IdentifierInvalidError extends IdentifierError {
  public constructor(identifier?: BeanIdentifier, options?: ErrorOptions) {
    super(
      identifier,
      `This is not a valid identifier: ${JSON.stringify(identifier)}`,
      options
    );
  }
}
