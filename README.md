<div align="center">

# WireDependencyInjection

[![License][license-image]][license-url] [![NPM version][npm-image]][npm-url] [![NPM downloads][npm-downloads-image]][npm-downloads-url] [![Twitter Follow][twitter-image-url]][twitter-url]

</div>

# Introduction

WireDependencyInjection is a simple and lightweight library that manages dependencies with dependency injection
principles.

You have a suggestion or want to report a bug? [Create an issue on our GitHub repository][issue-url].

Any type of contribution is welcomed. <P style="color: lime;">❤ Feel free to contribute to the project ❤</p>

# Table of contents

<!-- TOC -->

- [WireDependencyInjection](#wiredependencyinjection)
- [Introduction](#introduction)
- [Table of contents](#table-of-contents)
- [Installation](#installation)
- [How does it work?](#how-does-it-work)
  - [Storing dependencies](#storing-dependencies)
    - [Declaration](#declaration)
    - [Instancing](#instancing)
  - [Requesting dependencies](#requesting-dependencies)
    - [Wiring](#wiring)
    - [AutoWiring](#autowiring)
  - [Error management](#error-management)
    - [Thrown errors](#thrown-errors)
    - [Emitted errors](#emitted-errors)
- [Technical documentation](#technical-documentation)
  - [Core features](#core-features)
  - [Contributing](#contributing)
  - [License](#license)
  <!-- TOC -->

# Installation

```shell
npm install wire-dependency-injection
```

```shell
yarn add wire-dependency-injection
```

# How does it work?

The objective is to access our dependencies without having to pass them between functions and classes.

To solve this problem, we are using what's called dependency injection.

We will store [singletons](https://en.wikipedia.org/wiki/Singleton_pattern) (unique instance)
of our dependencies in a single object called dependency manager and get them back when required.

Example:

| Identifier       | Category   | Value                       |
| ---------------- | ---------- | --------------------------- |
| number-of-images | BEAN       | 10                          |
| download-service | SERVICE    | class DownloadService {...} |
| rest-controller  | CONTROLLER | class RestController {...}  |

## Storing dependencies

There are two ways to store dependencies.

### Declaration

The first one is a direct declaration, you will provide an identifier, the value and a category (optional), and that's
it.

```ts
dependencyManager.declare('maximum-amount', 25);
dependencyManager.declare('minimum-amount', 7, 'CONFIGURATION');
```

### Instancing

The second one is by instancing, you will provide

- an identifier.
- an initializer (a function or class that needs to be called to obtain the final value).
- a behaviour (an indication of how and when it should be instanced), CAUTIOUS by default.
- wires (a list of selectors for the required dependencies that will be passed in to the initializer) (optional).
- a category (optional).

There are a total of 3 behaviours you can use

- **CAUTIOUS**: Will wait for all of its dependencies to be present before instancing.
- **EAGER**: Will instance as soon as declared. Will fail if not all the dependencies are present.
- **LAZY**: Will instance only when requested. Will fail if not all the dependencies are present.

In this example, the SaveService will be instanced as soon as declared since all of its dependencies (none) are ready.

The SaveRestController will only be instanced when requested and will have the SaveService instance as parameter.

```ts
class SaveService {
  // ...
}

class SaveRestController {
  constructor(saveService: SaveService) {
    // ...
  }

  // ...
}

dependencyManager.instance('save-service', SaveService);
dependencyManager.instance('save-rest-controller', SaveRestController, {
  category: 'CONTROLLER',
  behaviour: LAZY,
  wires: ['save-service'],
});
```

## Requesting dependencies

There are two possible ways of requesting dependencies.

### Wiring

In the first one, we ask for a dependency and instantly get the result back, it can be an error if something went wrong,
a single or multiple results depending on what we requested.

To get a single result, provide the identifier or set getFirst to true if you only provide the category.

To get multiple results, only provide the wanted category.

```ts
const saveService: SaveService = dependencyManager.wire('save-service');
const controllers: Controller[] = dependencyManager.wire({
  category: 'CONTROLLER',
});
const firstDeclaredController: Controller = dependencyManager.wire({
  category: 'CONTROLLER',
  getFirst: true,
});

dependencyManager.asyncWire('save-service').then(()=>...);
await dependencyManager.asyncWire({
  category: 'CONTROLLER',
}, 500);
```

### AutoWiring

In the second one, we wait for the dependency to be ready before receiving it.

The function needs the same parameters as in the first method and a callback which will receive the dependency as a
parameter.

the returned value will be undefined.

```ts
dependencyManager.autoWire('save-service', (saveService: SaveService) => {
  /*...*/
});
dependencyManager.autoWire(
  { category: 'CONTROLLER' },
  (controllers: Controller[]) => {
    /*...*/
  }
);
let firstDeclaredController: Controller = dependencyManager.autoWire(
  { category: 'CONTROLLER', getFirst: true },
  (c) => {
    firstDeclaredController = c;
  }
);

class LoadController {
  private loadService = dependencyManager.autoWire(
    'load-service',
    (_) => (this.loadService = _)
  );
  // ...
}
```

## Error management

The error management is separated in two categories.

### Thrown errors

In case of a direct action like declaring or wiring single dependencies, the errors that occur can be caught using the
classic try/catch.

```ts
try {
  dependencyManager.declare('a-bean', 1);
  dependencyManager.declare('a-bean', 2);
} catch (e) {
  console.error();
}
```

### Emitted errors

In case of potentially indirect action like instancing, resolving, autoWiring or wiring multiple dependencies,
the errors are emitted with the `error` event in the extended `EventEmitter`.

```ts
dependencyManager.on('error', (error) => {
  /*...*/
});

dependencyManager.instance('a-service', AService);
```

The default listener prints the errors in the console.
It can be removed using the `removeListener` function and the `DEFAULT_ERROR_HANDLER`.

```ts
import { DEFAULT_ERROR_HANDLER } from 'wire-dependency-injection';

dependencyManager.removeListener('error', DEFAULT_ERROR_HANDLER);
```

# Technical documentation

Technical documentation can be found in the [`docs/`](./docs) folder or
on [https://leopoldhub.github.io/wire-dependency-injection/](https://leopoldhub.github.io/wire-dependency-injection/).

## Core features

- **No-Config**: Get started quickly without complex configuration files.
- **Dependency Injection**: Wire your dependencies at runtime, based on
  the [Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection) principle.
- **Modularity**: Create different types of dependencies to easily manage them afterward.

<!--

## Examples

**[Running typescript express example](https://github.com/leopoldhub/example-wire-dependency-injection)**

-->

## Contributing

Any contributions are welcome!

Please follow the guidelines in our Contributing Guide to contribute to the project.

Feel free to report any issue or feature request on the issue tracker.

## License

[Apache-2.0](LICENSE)

[license-image]: https://img.shields.io/github/license/leopoldhub/wire-dependency-injection.svg
[license-url]: https://github.com/leopoldhub/wire-dependency-injection/blob/master/LICENSE
[npm-image]: https://img.shields.io/npm/v/wire-dependency-injection.svg
[npm-url]: https://www.npmjs.com/package/wire-dependency-injection
[npm-downloads-image]: https://img.shields.io/npm/dm/wire-dependency-injection.svg
[npm-downloads-url]: https://www.npmjs.com/package/wire-dependency-injection
[twitter-image-url]: https://img.shields.io/twitter/follow/hubert_leopold
[twitter-url]: https://twitter.com/hubert_leopold
[repository-url]: https://github.com/leopoldhub/wire-dependency-injection
[issue-url]: https://github.com/leopoldhub/wire-dependency-injection/issues
