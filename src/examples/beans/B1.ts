import AbstractBeanCounter from './AbstractBeanCounter.js';
import dependencyInjector from '../../index.js';

export default class B1 extends AbstractBeanCounter {
  private b2Counter?: AbstractBeanCounter = dependencyInjector.autoWire(
    'counter2',
    (b2) => (this.b2Counter = b2)
  );

  public otherCounterPlus1() {
    this.counter = (this.b2Counter?.getCounter() ?? 0) + 1;
  }
}
export const registerBean = () => {
  dependencyInjector.registerBean('counter1', B1);
};
