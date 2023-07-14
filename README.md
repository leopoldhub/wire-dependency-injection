# Wire Dependency Injection

[![License][license-image]][license-url] [![NPM version][npm-image]][npm-url] [![NPM downloads][npm-downloads-image]][npm-downloads-url] [![Twitter Follow][twitter-image-url]][twitter-url]

<p style="color: lime;">❤ Feel free to contribute to the project ❤ </p>

Simple Dependency Injection is a lightweight and flexible library that simplifies the management of dependencies in your JavaScript / Typescript applications. It allows you to create independent beans, services, and controllers by injecting dependencies at runtime. With its intuitive API and seamless integration, it empowers developers to write modular and maintainable code.

## Installation

Follow these simple steps to install the library:

```shell
npm install --save wire-dependency-injection
```

## Features

- **No-Config**: Get started quickly without complex configuration files.
- **Dependency Injection**: Wire your dependencies at runtime, based on the [Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection) principle.
- **Modularity**: Create different types of dependencies to easily manage them afterward.

## Examples

**[Running typescript express example](https://github.com/leopoldhub/example-wire-dependency-injection)**

Let's say you have a service that provides the current time.

```javascript
class ClockService {
    public getCurrentTime() {
        return Date.now();
    };
}
```

And you want to use this service in different places.

You could pass the service instance to your different functions or services.

```javascript
download(clockService, service2, service3...);
```

But that's not practical and creates a significant dependency between your services (if you ever change the way you get the time, you would need to update it everywhere!).

You could also declare static singletons.

```javascript
export const clockService = new ClockService();
```

However, the same problem applies here. If you want to switch the service you use, you will encounter difficulties.

One of the solutions is to use Dependency Injection.

First, we need to declare our service (before we need it, so it's okay at startup).

```javascript
injector.registerBean('clockService', ClockService);
```

And every time we need it, we can simply call it using its name.

```javascript
injector.wire('clockService').getCurrentTime();
```

Now, let's say you have a service that prints the current time in the terminal.

We can wire the service with the `clockService` directly in the class declaration.

```javascript
class TimePrintService {
    private clockService = injector.autoWire('clockService', (b) => (this.clockService = b));

    public printCurrentTime() {
        console.log("Current time: ", clockService.getCurrentTime())
    };
}
```

The clockService variable is initially set to undefined and will be wired to the service as soon as it is available.

Now, let's say you have multiple services that can provide the time, and you want to define which one to use at runtime.

```javascript
class FranceClockService extends ClockService {
  // ...
}
class EnglandClockService extends ClockService {
  // ...
}
```

You can simply do it this way:

```javascript
if (COUNTRY === 'France') {
  injector.registerBean('clockService', FranceClockService);
} else {
  injector.registerBean('clockService', EnglandClockService);
}

injector.wire('clockService').getCurrentTime();
```

## Contributing

Any contributions are welcome!

Please follow the guidelines in our Contributing Guide to contribute to the project.

Feel free to report any issues or feature requests on the issue tracker.

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
