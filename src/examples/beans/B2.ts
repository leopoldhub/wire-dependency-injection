import AbstractBeanCounter from './AbstractBeanCounter.js';
import dependencyInjector from '../../index.js';

export default class B2 extends AbstractBeanCounter {
  private b1Counter?: AbstractBeanCounter = dependencyInjector.autoWire(
    'counter1',
    (b1) => (this.b1Counter = b1)
  );

  public otherCounterPlus1() {
    this.counter = (this.b1Counter?.getCounter() ?? 0) + 1;
  }
}
export const registerBean = () => {
  dependencyInjector.registerBean('counter2', B2);
};
