import IdentifierError from './IdentifierError';
import { BeanIdentifier } from '../../../types';

export default class IdentifierInvalidError extends IdentifierError {
  public constructor(identifier?: BeanIdentifier, options?: ErrorOptions) {
    super(
      identifier,
      `This is not a valid identifier: ${JSON.stringify(identifier)}`,
      options
    );
  }
}
