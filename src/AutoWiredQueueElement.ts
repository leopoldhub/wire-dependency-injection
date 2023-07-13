import { AutowiredDescriptor, ContainerId } from './types.js';
import { DEFAULT_CONTAINER_ID } from './index.js';

export default class AutoWireQueueElement {
  public constructor(
    private readonly beanId: string,
    private readonly containerId: ContainerId = DEFAULT_CONTAINER_ID,
    private readonly descriptor: AutowiredDescriptor
  ) {}

  public getBeanId() {
    return this.beanId;
  }

  public getContainerId() {
    return this.containerId;
  }

  public getDescriptor() {
    return this.descriptor;
  }
}
