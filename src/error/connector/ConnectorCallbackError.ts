import ConnectorError from './ConnectorError.js';
import { Connector } from '../../types.js';

/**
 * aaaaaaaa A aa
 */
export default class ConnectorCallbackError extends ConnectorError {
  public constructor(connector: Connector, options?: ErrorOptions) {
    super(
      connector,
      `An error occurred during the invocation of the connector callback: ${JSON.stringify(
        connector
      )}`,
      options
    );
  }
}
