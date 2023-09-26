import { BeanIdentifier } from '../../../types';
import ManagementError from '../ManagementError';

export default class IdentifierError extends ManagementError {
  public constructor(
    public readonly identifier?: BeanIdentifier,
    message?: string,
    options?: ErrorOptions
  ) {
    super(message, options);
  }
}
