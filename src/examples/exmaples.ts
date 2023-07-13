/* eslint-disable @typescript-eslint/no-unused-vars */
import { registerBean as registerB1 } from './beans/B1.js';
import { registerBean as registerB2 } from './beans/B2.js';
import dependencyInjector from '../index.js';
import AbstractBeanCounter from './beans/AbstractBeanCounter.js';

registerB1();
registerB2();

console.log(dependencyInjector.getContainers()[0].getBeans());

const counter1 = dependencyInjector.wire('counter1') as AbstractBeanCounter;
const counter2 = dependencyInjector.wire('counter2') as AbstractBeanCounter;

console.log(counter1);
console.log(counter2);

console.log('');

console.log(counter1.getCounter());
console.log(counter2.getCounter());

console.log('Incrementing counter 1 from counter 2 value +1');
counter1.otherCounterPlus1();
console.log('');

console.log(counter1.getCounter());
console.log(counter2.getCounter());

console.log('Incrementing counter 2 from counter 1 value +1');
counter2.otherCounterPlus1();
console.log('');

console.log(counter1.getCounter());
console.log(counter2.getCounter());
