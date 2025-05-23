# Dymexjs/DI

Dymexjs stands for DYnamic, Modular, EXtensible JavaScript/Typescript framework.

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/56ccd37ecb9e4e3fb7e2caa42627c19c)](https://app.codacy.com/gh/dymexjs/di/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![Codacy Badge](https://app.codacy.com/project/badge/Coverage/56ccd37ecb9e4e3fb7e2caa42627c19c)](https://app.codacy.com/gh/dymexjs/di/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_coverage)
[![Released under the MIT license.](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](./CODE_OF_CONDUCT.md)
[![PRs welcome!](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)
[![All Contributors](https://img.shields.io/github/all-contributors/dymexjs/di?color=ee8449&style=flat-square)](#contributors-)

A dependency injection library for Typescript/Javascript to help build well-structured code and easily testable applications.

Dymexjs/DI performs [Constructor Injection](https://en.wikipedia.org/wiki/Dependency_injection#Constructor_injection) on the constructors of decorated classes or classes with the properties `STATIC_INJECTIONS` and `STATIC_INJECTION_LIFETIME`, but also allows for injection into class fields, accessor's, methods and getter's.

<!-- TOC depthFrom:1 depthTo:5 -->

- [Dymexjs/DI](#dymexjsdi)
  - [Instalation](#instalation)
  - [Basic Usage](#basic-usage)
    - [Direct to container](#direct-to-container)
    - [Decorators](#decorators)
      - [Available Decorators](#available-decorators)
    - [Static Injection (without decorators)](#static-injection-without-decorators)
    - [Lifetime](#lifetime)
    - [Register](#register)
    - [Resolution](#resolution)
    - [Child Containers and Scopes](#child-containers-and-scopes)
    - [Cleaning](#cleaning)
  - [Circular Dependencies](#circular-dependencies)
  - [Documentation](#documentation)
  - [Code of Conduct](#code-of-conduct)
  - [How to Contribute](#how-to-contribute)
  - [License 📝](#license-)
  - [Contributors ✨](#contributors-)

<!-- /TOC -->

## Instalation

```sh
npm install --save @dymexjs/di
```

## Basic Usage

### Direct to container

```typescript
import { container } from "@dymexjs/di";

class TestService {
  printMessage() {
    return "I'm printting this message inside of TestService instance.";
  }
}

class Test {
  constructor(public testService: TestService) {}
}

container.registerSingleton(Test, Test, [TestService]);
// or for ex: container.registerSingleton("test", Test, [TestService]);

//and in another place after the registration
const testInstance = container.resolve(Test);
// or: const testInstance = container.resolve("test");

console.log(testInstance.testService.printMessage());
// logs "I'm printting this message inside of TestService instance."
```

More info here [Register](#register)

### Decorators

```typescript
import { container } from "@dymexjs/di";

class TestService {
  printMessage() {
    return "I'm printting this message inside of TestService instance.";
  }
}

@Singleton([TestService])
class Test {
  constructor(public testService: TestService) {}
}

const testInstance = container.resolve(Test);
console.log(testInstance.testService.printMessage());
// logs "I'm printting this message inside of TestService instance."
```

#### Available Decorators

- [@Singleton](docs/02-decorators.md#singleton)
- [@Transient](docs/02-decorators.md#transient)
- [@Scoped](docs/02-decorators.md#scoped)
- [@AutoInjectable](docs/02-decorators.md#autoinjectable)
- [@Inject](docs/02-decorators.md#inject)
- [@InjectAll](docs/02-decorators.md#injectall)

### Static Injection (without decorators)

**`STATIC_INJECTION_LIFETIME` and `STATIC_INJECTIONS`**

```typescript
import {
  container,
  STATIC_INJECTIONS,
  STATIC_INJECTION_LIFETIME,
  StaticInjectable,
} from "@dymexjs/di";

class TestClass implements StaticInjectable<typeof TestClass> {
  public propertyA = "test";
  public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
}
class TestClass2 implements StaticInjectable<typeof TestClass2> {
  constructor(public test: TestClass) {}
  public static [STATIC_INJECTIONS] = ["test"];
}
container.register("test", { useClass: TestClass });
const test2 = container.resolve(TestClass2);
console.log(test2.test.propertyA);
// logs "test"
```

This snippet creates (resolves to) one instance of `TestClass` that will be a `Singleton` instance and a `Transient` instance of `TestClass2` that will have `TestClass` injected into the constructor.

Instead of using `container.register` it's also possible to use the `TestClass` directly:

```typescript
import {
  container,
  STATIC_INJECTIONS,
  STATIC_INJECTION_LIFETIME,
  StaticInjectable,
} from "@dymexjs/di";

class TestClass implements StaticInjectable<typeof TestClass> {
  public propertyA = "test";
  public static [STATIC_INJECTION_LIFETIME] = Lifetime.Singleton;
}
class TestClass2 implements StaticInjectable<typeof TestClass2> {
  constructor(public test: TestClass) {}
  public static [STATIC_INJECTIONS] = [TestClass];
}
const test2 = container.resolve(TestClass2);
console.log(test2.test.propertyA);
// logs "test"
```

Use `static [STATIC_INJECTION_LIFETIME]` to define the lifetime of the instance created.

Use `static [STATIC_INJECTIONS]` to define the instances to inject into the constructor.

### Lifetime

Lifetime defines how instances will be resolved _(Lifetime = Scopes)_

```typescript
enum Lifetime {
  Singleton,
  Transient,
  Scoped,
}
```

- **Singleton**
  - Each resolve will return the same instance ( including resolves from child containers)
- **Transient**
  - This is the default registration scope, a new instance will be created with each resolve
- **Scoped**
  - The container will resolve always to the same instance, like the singleton, but only when inside a Scope, [createScope](docs/02-decorators.md#createScope) for more info, when a scope is not defined the resolution will throw an Error.

### Register

For using the resolving capabilities of the container first the things have to be registered, to achieve this, there are multiple ways, one of them is by usin [register()](docs/03-01-register.md)

### Resolution

Process to resolve a token into an instance, resolving all the necessary dependencies in between using [resolve()](docs/03-02-resolve.md)

### Child Containers and Scopes

It's possible to create child containers and scopes for the resolution of the token's, mode info [here](docs/03-03-child_scope.md)

### Cleaning

It's also possible to [clean](docs/03-04-cleaning.md#cleaning) the instances of one container or [reset](docs/03-04-cleaning.md#reset) the container.

## Circular Dependencies

Cyclic dependencies are a problem, and should be avoided, but sometimes that's not possible, to solve this problem the container resolves an already existing instance in resolution by creating a proxy of the instance that will later be resolved into the instance.

## Documentation

The detailed usage guide and API documentation for the project can be found in the [./docs](docs/01-getting-started.md) folder of the repository

## Code of Conduct

We expect everyone to abide by our [**Code of Conduct**](./CODE_OF_CONDUCT.md). Please read it.

## How to Contribute

Check out our [**Contributing Guide**](./CONTRIBUTING.md) for information on contributing.

## License 📝

Licensed under the [MIT License](./LICENSE)

## Contributors ✨

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://www.faroisdeportugal.com"><img src="https://avatars.githubusercontent.com/u/1280607?v=4?s=50" width="50px;" alt="João Parreira"/><br /><sub><b>João Parreira</b></sub></a><br /><a href="#maintenance-n3okill" title="Maintenance">🚧</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
