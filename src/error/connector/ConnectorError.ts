import DependencyInjectionError from '../DependencyInjectionError.js';
import { Connector } from '../../types.js';

export default class ConnectorError extends DependencyInjectionError {
  public constructor(
    public readonly connector: Connector,
    message?: string,
    options?: ErrorOptions
  ) {
    super(message, options);
  }
}
