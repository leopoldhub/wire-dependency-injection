import Bean from '../../src/Bean';
import { BEAN, BeanInitializer, CAUTIOUS, NO_INSTANCE } from '../../src';
import BeanAlreadyInitializedError from '../../src/error/bean/BeanAlreadyInitializedError';
import BeanInitializerNotInstantiableError from '../../src/error/bean/BeanInitializerNotInstantiableError';
import BeanInitializationError from '../../src/error/bean/BeanInitializationError';
import fn = jest.fn;

describe('Bean initialization', () => {
  test('should not initialize when bean is ready', () => {
    const bean = new Bean(
      'bean',
      { value: undefined, category: BEAN },
      { behaviour: NO_INSTANCE },
      true
    );
    expect(bean.isReady()).toBeTruthy();
    expect(() => bean.initialize()).toThrow(BeanAlreadyInitializedError);
  });

  test('should not initialize if initializer is missing', () => {
    const bean = new Bean(
      'bean',
      { initializer: undefined as unknown as BeanInitializer, category: BEAN },
      { behaviour: CAUTIOUS }
    );
    expect(() => bean.initialize()).toThrow(
      BeanInitializerNotInstantiableError
    );
  });

  test('should not initialize if initializer is not a function or a class', () => {
    const bean = new Bean(
      'bean',
      { initializer: 1 as unknown as BeanInitializer, category: BEAN },
      { behaviour: CAUTIOUS }
    );
    expect(() => bean.initialize()).toThrow(BeanInitializationError);
  });

  test('should not initialize if an error is throws in the initializer', () => {
    const initializer = () => {
      throw new Error();
    };
    const bean = new Bean(
      'bean',
      { initializer: initializer, category: BEAN },
      { behaviour: CAUTIOUS }
    );
    expect(() => bean.initialize()).toThrow(BeanInitializationError);
  });

  test('should call the initializer', () => {
    const initializer = fn();
    const bean = new Bean(
      'bean',
      { initializer: initializer, category: BEAN },
      { behaviour: CAUTIOUS }
    );
    bean.initialize();
    expect(initializer).toBeCalled();
    const constructorFunction = fn();
    class ClassInitializer {
      constructor() {
        constructorFunction();
      }
    }
    const bean2 = new Bean(
      'bean2',
      { initializer: ClassInitializer, category: BEAN },
      { behaviour: CAUTIOUS }
    );
    bean2.initialize();
    expect(constructorFunction).toBeCalled();
  });

  test('should set the value once initialized', () => {
    const res = Math.random() * 1000;
    const initializer = () => res;
    const bean = new Bean(
      'bean',
      { initializer: initializer, category: BEAN },
      { behaviour: CAUTIOUS }
    );
    bean.initialize();
    expect(bean.value).toBe(res);
  });

  test('should set ready true once initialized', () => {
    const initializer = fn();
    const bean = new Bean(
      'bean',
      { initializer: initializer, category: BEAN },
      { behaviour: CAUTIOUS }
    );
    bean.initialize();
    expect(bean.isReady()).toBeTruthy();
  });
});
