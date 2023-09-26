import DependencyInjectionError from '../DependencyInjectionError';
import { Connector } from '../../types';

export default class ConnectorError extends DependencyInjectionError {
  public constructor(
    public readonly connector: Connector,
    message?: string,
    options?: ErrorOptions
  ) {
    super(message, options);
  }
}
