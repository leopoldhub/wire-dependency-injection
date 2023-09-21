/* eslint-disable @typescript-eslint/ban-types, @typescript-eslint/no-unused-vars */
// TODO: refactor types
import { ClassType, InstanceBeanBehaviour } from './types.js';
import Bean from './Bean.js';
import { arrayIncludesArrayAsChild } from './utils.js';

export const NO_INSTANCE = 'NO_INSTANCE';
export const CAUTIOUS = 'CAUTIOUS';
export const EAGER = 'EAGER';
export const LAZY = 'LAZY';

export class DependencyManager {
  private readonly _beans: Array<Bean> = [];
  private readonly _connectors: Array<{
    identifier: string;
    callback: (bean: unknown) => void;
  }> = [];

  public parseIdentifier(object: unknown) {
    if (typeof object === 'string') {
      return object;
    }
    return (object as { name?: string }).name;
  }

  public getReadyBeans() {
    return this._beans.filter((b) => b.isReady());
  }

  public getUnreadyBeans() {
    return this._beans.filter((b) => !b.isReady());
  }

  public getUnreadyBean(identifier: string) {
    return this.getUnreadyBeans().find((b) => b.identifier === identifier);
  }

  public getBean(identifier: string) {
    return this._beans.find((bean) => bean.identifier === identifier);
  }

  public getReadyBean(identifier: string) {
    return this.getReadyBeans().find((b) => b.identifier === identifier);
  }

  public haveBean(identifier: string) {
    return !!this.getBean(identifier);
  }

  private getBeanIndex(bean: Bean) {
    return this._beans.indexOf(bean);
  }

  private removeBean(bean: Bean) {
    this._beans.splice(this.getBeanIndex(bean), 1);
  }

  public registerBean(bean: Bean) {
    if (this.haveBean(bean.identifier)) {
      throw new Error('identifier already taken');
    }
    this._beans.push(bean);
  }

  public declare(identifier: string, value: unknown) {
    const identifierValue = this.parseIdentifier(identifier ?? value);
    if (!identifierValue) {
      throw new Error('invalid identifier');
    }
    const bean = new Bean(
      identifierValue,
      { value: value },
      { behaviour: NO_INSTANCE }
    );
    this.registerBean(bean);
    this.resolveBeans();
  }

  public instance(
    identifier: string,
    value: Function | ClassType,
    options: {
      behaviour: InstanceBeanBehaviour;
      wiring?: Array<string>;
    } = { behaviour: CAUTIOUS }
  ) {
    const identifierValue = this.parseIdentifier(identifier ?? value);
    if (!identifierValue) {
      throw new Error('invalid identifier');
    }
    const bean = new Bean(identifierValue, { initializer: value }, options);
    this.registerBean(bean);
    this.resolveBeans();
  }

  public canBeanBeInitialized(bean: Bean) {
    if (bean.isReady() || !bean.initializer) {
      return false;
    }
    const wires = (bean.options.wiring ?? [])?.map(
      (w) => this.getReadyBean(w)?.value
    );
    return !wires?.some((w) => w === undefined);
  }

  public initializeBean(bean: Bean) {
    if (!this.canBeanBeInitialized(bean)) {
      if (!bean.initializer) {
        throw new Error('bean does not have an initializer');
      }
      throw new Error(
        `bean is missing the following dependencies and connot be initialised: ${(
          bean.options.wiring ?? []
        ).filter((w) => !this.getReadyBean(w))}`
      );
    }

    const wires = (bean.options.wiring ?? [])?.map(
      (w) => this.getReadyBean(w)?.value
    );
    bean.initialize(...wires);
  }

  public resolveInterdependencies() {
    const interdependencyPairs: Array<Array<Bean>> = [];
    this.getUnreadyBeans()
      .filter((bean) => bean.options.behaviour !== NO_INSTANCE)
      .forEach((bean1) => {
        bean1.options.wiring
          ?.map((w) => this.getUnreadyBean(w))
          .filter((bean) => bean !== undefined)
          .forEach((bean2) => {
            if (bean2?.options.wiring?.includes(bean1.identifier)) {
              const pair = [bean1, bean2].sort(
                (a, b) => a?.identifier.localeCompare(b?.identifier)
              );
              if (!arrayIncludesArrayAsChild(interdependencyPairs, pair)) {
                interdependencyPairs.push(pair);
              }
            }
          });
      });

    interdependencyPairs.forEach((pair) => {
      this.removeBean(pair[0]);
      this.removeBean(pair[1]);
      console.log(
        'interdependency found between beans',
        pair.map((b) => b.identifier),
        '!!!!'
      );
    });
  }

  public resolveBeans() {
    this.resolveInterdependencies();

    const errors: Array<{ bean: Bean; error: string }> = [];
    const unReadyBeans = this.getUnreadyBeans();

    let solvedSome = false;

    unReadyBeans
      .filter((b) => [EAGER, CAUTIOUS].includes(b.options.behaviour))
      .forEach((bean) => {
        try {
          if (
            bean.options.behaviour === EAGER ||
            this.canBeanBeInitialized(bean)
          ) {
            this.initializeBean(bean);
            solvedSome = true;
          }
        } catch (e) {
          errors.push({
            bean: bean,
            error: e instanceof String ? (e as string) : (e as Error).message,
          });
        }
      });

    errors.forEach((e) => {
      this.removeBean(e.bean);
      console.log('bean:', e.bean.identifier, ', error:', e.error);
    });

    if (solvedSome) {
      this.resolveBeans();
    }
  }

  public resolveConnectors() {
    const errors: Array<{ bean: Bean; error: string }> = [];

    this._connectors.forEach((connector) => {
      let bean = this.getBean(connector.identifier);
      if (bean && !bean.isReady() && bean.options.behaviour === LAZY) {
        try {
          this.initializeBean(bean);
        } catch (e) {
          errors.push({
            bean: bean,
            error: e instanceof String ? (e as string) : (e as Error).message,
          });
        }
      }
      bean = this.getReadyBean(connector.identifier);
      if (bean) {
        return connector.callback(bean.value);
      }
    });

    errors.forEach((e) => {
      this.removeBean(e.bean);
      console.log('bean:', e.bean.identifier, ', error:', e.error);
    });
  }

  public wire(identifier: string) {
    let bean = this.getReadyBean(identifier);
    if (!bean) {
      bean = this.getBean(identifier);
      if (bean) {
        if (bean.options.behaviour === LAZY) {
          try {
            this.initializeBean(bean);
          } catch (e) {
            this.removeBean(bean);
            throw e;
          }
        } else {
          throw new Error('the bean with this identifier is not ready yet');
        }
      } else {
        throw new Error('no bean found with this identifier');
      }
    }
    return bean.value;
  }

  public autowire(identifier: string, callback: (value: unknown) => unknown) {
    this._connectors.push({ identifier: identifier, callback: callback });
    this.resolveConnectors();
  }
}
