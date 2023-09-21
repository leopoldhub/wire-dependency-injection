import { AutowiredDescriptor, ContainerIdType } from './types.js';
import { DEFAULT_CONTAINER_ID } from './index.js';

/**
 * Represents an element in the AutoWire queue.
 */
export default class AutoWireQueueElement {
  /**
   * Constructs a new instance of the AutoWireQueueElement class.
   * @param beanId - The ID of the bean to AutoWire.
   * @param containerId - The ID of the container to retrieve the bean from.
   * @param descriptor - The autowired descriptor function.
   */
  public constructor(
    protected readonly beanId: string,
    protected readonly containerId: ContainerIdType = DEFAULT_CONTAINER_ID,
    protected readonly descriptor: AutowiredDescriptor
  ) {}

  /**
   * Gets the ID of the bean to AutoWire.
   * @returns The bean ID.
   */
  public getBeanId() {
    return this.beanId;
  }

  /**
   * Gets the ID of the container to retrieve the bean from.
   * @returns The container ID.
   */
  public getContainerId() {
    return this.containerId;
  }

  /**
   * Gets the autowired descriptor function.
   * @returns The autowired descriptor function.
   */
  public getDescriptor() {
    return this.descriptor;
  }
}
