import { BeanCategory, BeanIdentifier } from '../../types';
import ManagementError from './ManagementError';

export default class BeanNotFoundError extends ManagementError {
  public constructor(
    identifier?: BeanIdentifier,
    category?: BeanCategory,
    options?: ErrorOptions
  ) {
    super(
      `No bean found with this identifier: ${JSON.stringify(identifier)}${
        category ? ` category: ${JSON.stringify(category)}` : ''
      }`,
      options
    );
  }
}
