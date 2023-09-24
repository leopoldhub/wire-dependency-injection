import { BeanCategory, BeanIdentifier } from '../types.js';
import DependencyInjectionError from './DependencyInjectionError.js';

export default class BeanNotFoundError extends DependencyInjectionError {
  public constructor(identifier?: BeanIdentifier, category?: BeanCategory) {
    super(
      `No bean found with this identifier: ${JSON.stringify(identifier)}${
        category ? ` category: ${JSON.stringify(category)}` : ''
      }`
    );
  }
}
