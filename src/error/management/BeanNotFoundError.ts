import { BeanCategory, BeanIdentifier } from '../../types.js';
import DependencyInjectionError from '../DependencyInjectionError.js';
import ManagementError from './ManagementError.js';

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
