import { CAUTIOUS, DependencyManager, EAGER, LAZY } from './index.js';

const dependencyManager = new DependencyManager();

// declare simple bean

dependencyManager.declare('a-bean', 5);

console.log(dependencyManager.wire('a-bean'));

// dependencyManager.declare('a-bean', 6);

dependencyManager.declare('b-bean', 6);

dependencyManager.autowire('b-bean', (val) => console.log(val));

// declare instance bean

// CAUTIOUS

class CautiousA {
  public a = 10;
}

dependencyManager.instance('cautious-a-bean', CautiousA);

console.log(dependencyManager.wire('cautious-a-bean'));

class CautiousB {
  constructor(cautiousA: CautiousA) {
    console.log('cautious-a.a:', cautiousA.a);
  }
}

dependencyManager.instance('cautious-b-bean', CautiousB, {
  behaviour: CAUTIOUS,
  wiring: ['cautious-a-bean'],
});

class CautiousD {
  constructor(cautiousC: CautiousC) {
    console.log('cautious-c.a:', cautiousC.a);
  }
}

dependencyManager.instance('cautious-d-bean', CautiousD, {
  behaviour: CAUTIOUS,
  wiring: ['cautious-c-bean'],
});

class CautiousC {
  public a = 15;
}

dependencyManager.instance('cautious-c-bean', CautiousC);

class CautiousE {
  constructor(cautiousF: CautiousF) {
    console.log('cautious-f:', cautiousF);
  }
}

class CautiousF {
  constructor(cautiousE: CautiousE) {
    console.log('cautious-e:', cautiousE);
  }
}

dependencyManager.instance('cautious-e-bean', CautiousE, {
  behaviour: CAUTIOUS,
  wiring: ['cautious-f-bean'],
});

dependencyManager.instance('cautious-f-bean', CautiousF, {
  behaviour: CAUTIOUS,
  wiring: ['cautious-e-bean'],
});

// EAGER

class EagerG {
  constructor(cautiousC: CautiousC) {
    console.log('cautious-c.a:', cautiousC.a);
  }
}

dependencyManager.instance('eager-g-bean', EagerG, {
  behaviour: EAGER,
  wiring: ['cautious-c-bean'],
});

class EagerH {
  constructor(cautiousI: CautiousI) {
    console.log('cautious-i', cautiousI);
  }
}

dependencyManager.instance('eager-h-bean', EagerH, {
  behaviour: EAGER,
  wiring: ['cautious-i-bean'],
});

class CautiousI {}

dependencyManager.instance('cautious-i-bean', CautiousI);

// LAZY

class LazyJ {
  constructor() {
    console.log('~~lazy~~');
  }
}

dependencyManager.instance('lazy-j-bean', LazyJ, {
  behaviour: LAZY,
});

dependencyManager.wire('lazy-j-bean');
dependencyManager.wire('lazy-j-bean');

class LazyK {
  constructor() {
    console.log('K~~lazy~~K');
  }
}

dependencyManager.instance('lazy-k-bean', LazyK, {
  behaviour: LAZY,
  wiring: ['missing-bean'],
});

dependencyManager.wire('lazy-k-bean');