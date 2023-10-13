import { BeanIdentifier } from '../../../types.js';
import ManagementError from '../ManagementError.js';

export default class IdentifierError extends ManagementError {
  public constructor(
    public readonly identifier?: BeanIdentifier,
    message?: string,
    options?: ErrorOptions
  ) {
    super(message, options);
  }
}
