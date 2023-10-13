import DependencyManager, {
  ErrorEventId,
} from '../../src/DependencyManager.js';
import Bean from '../../src/Bean.js';
import { BEAN, BeanCategory, CAUTIOUS } from '../../src/index.js';
import SelfDependencyError from '../../src/error/dependency/SelfDependencyError.js';
import InterDependencyError from '../../src/error/dependency/InterDependencyError.js';
import fn = jest.fn;

describe('Interdependencies of unready beans', () => {
  let simpleBeanADepB!: Bean;
  let simpleBeanBDepA!: Bean;

  let simpleBeanCSelfDep!: Bean;

  const CATEGORY1: BeanCategory = 'group1';
  let cat1BeanDDepCat1!: Bean;
  let cat1BeanEDepD!: Bean;

  beforeEach(() => {
    simpleBeanADepB = new Bean(
      'simple-bean-a',
      { value: undefined, category: BEAN },
      { behaviour: CAUTIOUS, wiring: ['simple-bean-b'] }
    );
    simpleBeanBDepA = new Bean(
      'simple-bean-b',
      { value: undefined, category: BEAN },
      { behaviour: CAUTIOUS, wiring: ['simple-bean-a'] }
    );
    simpleBeanCSelfDep = new Bean(
      'simple-bean-c',
      { value: undefined, category: BEAN },
      { behaviour: CAUTIOUS, wiring: ['simple-bean-c'] }
    );
    cat1BeanDDepCat1 = new Bean(
      'grouped-bean-d',
      { value: undefined, category: CATEGORY1 },
      { behaviour: CAUTIOUS, wiring: [{ category: CATEGORY1 }] }
    );
    cat1BeanEDepD = new Bean(
      'grouped-bean-e',
      { value: undefined, category: CATEGORY1 },
      { behaviour: CAUTIOUS, wiring: ['grouped-bean-d'] }
    );
  });

  it('should delete the problematic bean when there is an interdependency', () => {
    class DM extends DependencyManager {
      public _beans: Array<Bean> = [];

      constructor() {
        super();
        this._beans.push(simpleBeanADepB, simpleBeanBDepA);
        this.removeDefaultErrorHandler();
      }

      public _resolveBeanInterDependencies(bean: Bean) {
        return super._resolveBeanInterDependencies(bean);
      }

      public _getBeanInterdependencyPaths(bean: Bean): Array<Array<Bean>> {
        return [[bean]];
      }
    }
    const dm = new DM();
    dm.on(ErrorEventId, fn());
    dm._resolveBeanInterDependencies(simpleBeanADepB);
    expect(dm._beans).not.toContain(simpleBeanADepB);
    expect(dm._beans).toContain(simpleBeanBDepA);
  });

  it('should throw correctly in case of selfdependency', () => {
    class DM extends DependencyManager {
      constructor() {
        super();
        this.removeDefaultErrorHandler();
      }

      public _resolveBeanInterDependencies(bean: Bean) {
        return super._resolveBeanInterDependencies(bean);
      }

      public _getBeanInterdependencyPaths(bean: Bean): Array<Array<Bean>> {
        return [[bean]];
      }
    }
    const dm = new DM();
    const errFn = fn((err) => expect(err).toBeInstanceOf(SelfDependencyError));
    dm.on(ErrorEventId, errFn);
    dm._resolveBeanInterDependencies(simpleBeanADepB);
    expect(errFn).toHaveBeenCalled();
  });

  it('should throw correctly in case of interdependency', () => {
    class DM extends DependencyManager {
      constructor() {
        super();
        this.removeDefaultErrorHandler();
      }

      public _resolveBeanInterDependencies(bean: Bean) {
        return super._resolveBeanInterDependencies(bean);
      }

      public _getBeanInterdependencyPaths(bean: Bean): Array<Array<Bean>> {
        return [[bean, simpleBeanADepB]];
      }
    }
    const dm = new DM();
    const errFn = fn((err) => expect(err).toBeInstanceOf(InterDependencyError));
    dm.on(ErrorEventId, errFn);
    dm._resolveBeanInterDependencies(simpleBeanADepB);
    expect(errFn).toHaveBeenCalled();
  });

  describe('detect interdependencies', () => {
    it('should detect self dependencies, a -> a', () => {
      class DM extends DependencyManager {
        constructor() {
          super();
          this._beans.push(simpleBeanCSelfDep);
        }

        public _getBeanInterdependencyPaths(
          bean: Bean,
          parentBeans: Array<Bean> = [],
          isIngroup?: boolean
        ): Array<Array<Bean>> {
          return super._getBeanInterdependencyPaths(
            bean,
            parentBeans,
            isIngroup
          );
        }
      }
      const dm = new DM();
      expect(dm._getBeanInterdependencyPaths(simpleBeanCSelfDep)).toEqual([
        [simpleBeanCSelfDep],
      ]);
    });

    it('should detect direct interdependency, a -> b -> a', () => {
      class DM extends DependencyManager {
        constructor() {
          super();
          this._beans.push(simpleBeanBDepA, simpleBeanADepB);
        }

        public _getBeanInterdependencyPaths(
          bean: Bean,
          parentBeans: Array<Bean> = [],
          isIngroup?: boolean
        ): Array<Array<Bean>> {
          return super._getBeanInterdependencyPaths(
            bean,
            parentBeans,
            isIngroup
          );
        }
      }
      const dm = new DM();
      expect(dm._getBeanInterdependencyPaths(simpleBeanBDepA)).toEqual([
        [simpleBeanBDepA, simpleBeanADepB],
      ]);
    });

    it("shouldn't detect interdependency in a group including the parent, a(C1) -> (C1)", () => {
      class DM extends DependencyManager {
        constructor() {
          super();
          this._beans.push(cat1BeanDDepCat1);
        }

        public _getBeanInterdependencyPaths(
          bean: Bean,
          parentBeans: Array<Bean> = [],
          isIngroup?: boolean
        ): Array<Array<Bean>> {
          return super._getBeanInterdependencyPaths(
            bean,
            parentBeans,
            isIngroup
          );
        }
      }
      const dm = new DM();
      expect(dm._getBeanInterdependencyPaths(cat1BeanDDepCat1)).toHaveLength(0);
    });

    it("shouldn't detect interdependency in a group including one of the parent, a(C1) -> b(C1) -> (C1)", () => {
      class DM extends DependencyManager {
        constructor() {
          super();
          this._beans.push(cat1BeanDDepCat1, cat1BeanEDepD);
        }

        public _getBeanInterdependencyPaths(
          bean: Bean,
          parentBeans: Array<Bean> = [],
          isIngroup?: boolean
        ): Array<Array<Bean>> {
          return super._getBeanInterdependencyPaths(
            bean,
            parentBeans,
            isIngroup
          );
        }
      }
      const dm = new DM();
      expect(dm._getBeanInterdependencyPaths(cat1BeanEDepD)).toHaveLength(0);
    });

    it("shouldn't detect interdependency in a group including one of the parent, a(C1) -> (C1) -> b(C1) ...> a(C1)", () => {
      class DM extends DependencyManager {
        constructor() {
          super();
          this._beans.push(cat1BeanDDepCat1, cat1BeanEDepD);
        }

        public _getBeanInterdependencyPaths(
          bean: Bean,
          parentBeans: Array<Bean> = [],
          isIngroup?: boolean
        ): Array<Array<Bean>> {
          return super._getBeanInterdependencyPaths(
            bean,
            parentBeans,
            isIngroup
          );
        }
      }
      const dm = new DM();
      expect(dm._getBeanInterdependencyPaths(cat1BeanDDepCat1)).toHaveLength(0);
    });
  });
});
