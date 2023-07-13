export default abstract class AbstractBeanCounter {
  protected counter = 0;

  public abstract otherCounterPlus1(): void;

  public getCounter() {
    return this.counter;
  }
}
