# Averix/DI

A dependency injection library for Typescript/Javascript to help build well-structured code and easily testable applications.

[TOC]

## Instalation

```sh
npm install --save @averix/di
```

## Basic Usage

### Decorators

```typescript
import { container } from "@averix/di";

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

### Static Injection (without decorators)

#### Properties

##### [STATIC_INJECTION_LIFETIME] and [STATIC_INJECTIONS]

```typescript
import { container, STATIC_INJECTIONS, STATIC_INJECTION_LIFETIME, StaticInjectable } from "@averix/di";

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
import { container, STATIC_INJECTIONS, STATIC_INJECTION_LIFETIME, StaticInjectable } from "@averix/di";

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

# API

Averix/DI performs [Constructor Injection](https://en.wikipedia.org/wiki/Dependency_injection#Constructor_injection) on the constructors of decorated classes or classes with the properties `STATIC_INJECTIONS` and `STATIC_INJECTION_LIFETIME`, but also allows for injection into class fields, accessor's, methods and getter's.

## Lifetime

Lifetime defines how instances will be resolved _(Lifetime = Scopes)_

### Available Scopes

```typescript
enum Lifetime {
  Singleton,
  Transient,
  Scoped,
}
```

- Singleton
  - Each resolve will return the same instance ( including resolves from child containers)
- Transient
  - This is the default registration scope, a new instance will be created with each resolve
- Scoped
  - The container will resolve always to the same instance, like the singleton, but only when inside a Scope, [createScope]("createScope") for more info, when a scope is not defined the resolution will throw an Error.

## Static Injection

### [STATIC_INJECTION_LIFETIME]

Use `static [STATIC_INJECTION_LIFETIME]` to define the lifetime of the instance created.

### [STATIC_INJECTIONS]

Use `static [STATIC_INJECTIONS]` to define the instances to inject into the constructor.

## Decorators

### @Singleton

Class decorator factory that registers the class as a `singleton` within the container.

```typescript
function Singleton(
  id?: InjectionToken | InterfaceId | Array<InjectionToken | InterfaceId>,
  dependencies?: Array<InjectionToken | InterfaceId>,
): ClassDecorator;
```

```
@param id Optional token or array of dependencies to inject into the class.
@param dependencies Optional array of dependencies to inject into the class.
@returns A class decorator that registers the class as a singleton in the container.
```

#### Usage

```typescript
@Singleton()
class TestClass {}
const instance1 = container.resolve(TestClass);
```

or

```typescript
@Singleton("serviceA") //With token to register
class ServiceA {}
@Singleton(["serviceA"]) //With an array of dependencies to resolve when creating the instance
class ServiceB {
  constructor(public serviceA: ServiceA) {}
}
const b = container.resolve<ServiceB>(ServiceB);
```

or

```typescript
@Singleton()
class ServiceA {}
@Singleton([ServiceA]) //With an array of dependencies to resolve when creating the instance
class ServiceB {
  constructor(public serviceA: ServiceA) {}
}
const b = container.resolve<ServiceB>(ServiceB);
```

**NOTE:** The same pattern is used for Transient and Scoped decorators.

### @Transient

Class decorator factory that registers the class as transient within the container.

```typescript
function Transient(
  id?: InjectionToken | InterfaceId | Array<InjectionToken | InterfaceId>,
  dependencies?: Array<InjectionToken | InterfaceId>,
): ClassDecorator;
```

```
@param id Optional token or array of dependencies to inject into the class.
@param dependencies Optional array of dependencies to inject into the class.
@returns A class decorator that registers the class as a transient in the container.
```

### @Scoped

Class decorator factory that registers the class as scoped within the container.

```typescript
function Scoped(
  id?: InjectionToken | InterfaceId | Array<InjectionToken | InterfaceId>,
  dependencies?: Array<InjectionToken | InterfaceId>,
): ClassDecorator;
```

```
@param id Optional token or array of dependencies to inject into the class.
@param dependencies Optional array of dependencies to inject into the class.
@returns A class decorator that registers the class as a scoped in the container.
```

#### Usage

**Wrong way:**

```typescript
@Scoped()
class TestClass {}
const test = container.resolve(TestClass);
```

will throw an `UndefinedScopeError` because the resolve method has no scope to resolve the instance of the object

**Correct way:**

```typescript
@Scoped()
class TestClass {}
const scope = container.createScope(); // Note the createScope call to create a scope for the resolution
const instance1 = container.resolve(TestClass, scope); // Note the scope passed to the resolution
```

### @AutoInjectable

```typescript
type IAutoInjectableOptions = {
  all?: Array<InjectionToken | InterfaceId>;
};

function AutoInjectable(dependencies?: Array<InjectionToken | InterfaceId>, options?: IAutoInjectableOptions);
```

```
@param dependencies Optional array of dependencies to inject into the class.
@returns A class decorator factory that replaces the decorated class constructor with a parameterless constructor that will resolve the dependencies automatically
```

#### Usage

```typescript
class TestA {}
@AutoInjectable([TestA])
class TestB {
  constructor(
    public otherArg: string,
    public testA?: TestA, // In order to call new with only one param the injected param must be marked as optional
  ) {}
}
const testB = new TestB("test");
//testB.testA will be an instance of TestA
```

### @Inject

```typescript
function Inject(token: InjectionToken | InterfaceId | Array<InjectionToken | InterfaceId>);
```

```
@param token The token or array of tokens to inject.
@returns A decorator function that injects the dependency.
```

#### Usage

##### Inject into a class field

```typescript
@Singleton()
class TestA {
  prop = "testA";
}

class TestB {
  @Inject(TestA)
  testA!: TestA;
}
// Will inject 'TestA' into the field 'testA'
```

##### Inject into a class accessor

```typescript
@Singleton()
class TestA {
  prop = "testA";
}

class TestB {
  @Inject(TestA)
  accessor testA!: TestA;
}
// Will inject 'TestA' into the accessor.get 'testA'
```

##### Inject into a class method

```typescript
@Singleton()
class TestA {
  prop = "testA";
}
class TestB {
  @Inject(TestA)
  doSomething(testA?: TestA) {
    return testA!.prop;
  }
}
// Will inject 'TestA' into the method 'doSomething'
```

##### Inject into a class getter

```typescript
@Singleton()
class TestA {
  prop = "testA";
}
class TestB {
  propTestA?: TestA;
  @Inject(TestA)
  get testA(): TestA {
    return this.propTestA!;
  }
}
// Will inject 'TestA' into the getter 'testA'
```

### @InjectAll

```typescript
function InjectAll(token: InjectionToken | InterfaceId | Array<InjectionToken | InterfaceId>);
```

Works like the [@Inject](#inject) decorator but will solve all the registrations of the token(s) and return array(s) of instance(s).

##### Inject into a class field

```typescript
class TestA {
  prop = "testA";
}
container.registerSingleton(TestA, TestA);
container.registerSingleton(TestA, TestA);

class TestB {
  @InjectAll(TestA)
  testA!: TestA[];
}
// Will inject 'TestA[]' into the field 'testA'
```

## Container

The container is the place where the dependencies are registered and latter will be resolved, for this you give a token to the container and after all the resolutions necessary the container will return the required object instance.

The decorators [@Singleton](#singleton), [@Transient](#transient) and [@Scoped](#scoped) will auto-register the classes where they're being called into the container.

Registrations take the form of Token/Provider pair.

### InjectionToken

A token may be either a string, a symbol, a class constructor, a `Token` or an `InterfaceId`

```typescript
type InjectionToken<T = any> = string | symbol | ConstructorType<T> | Token | InterfaceId<T>;
```

The `Token` object is just an helper class to allow for type-safe access to a registration in the container.

```typescript
//File: jwt.secret.ts
import { container, Token } from "@averix/di";

export const JWT_SECRET = new Token("jwt_secret");
container.registerValue(JWT_SECRET, "my secure secret");

/**
 * Somewhere else in the code you import the token and resolve the value from the container
 */
// File: resolution.ts
import { container } from "@averix/di";
import { JWT_SECRET } from "./jwt.secret";

let secret = container.resolve(JWT_SECRET);
// secret = "my secure secret"
```

The `InterfaceId` is a special object to allow for the registration of interfaces, and must be create with `createInterfaceId()`

```typescript
interface SA {}
const SA = createInterfaceId<SA>("SA"); // the const variable and the interface should have the same name

interface SB {
  readonly serviceA: SA;
}
const SB = createInterfaceId<SB>("SB");

@Singleton(SA)
class ServiceA {}
@Singleton(SB, [SA])
class ServiceB {
  constructor(public serviceA: SA) {}
}
const b = container.resolve<SB>(SB);
// 'b' will be an instance of ServiceB, resolved trough the interface
```

For more examples see `tests/sync/decorators.test.ts` or `tests/async/decorators.test.ts`) -> `Interface Decorators`

### Providers

The container uses the providers to register information needed to resolve an instance for a given token.

#### Class Provider

```typescript
{
  token: InjectionToken<T>;
  useClass: ConstructorType<T>;
}
```

This provider is used to resolve classes by their constructor.

```typescript
type ConstructorType<T> = new (...args: Array<any>) => T;
```

#### Value Provider

```typescript
{
  token: InjectionToken<T>,
  useValue: T
}
```

This provider is used to resolve a value in the container, this value can be a constant or an instance that as been instantiated in a particular way.

#### Factory Provider

```typescript
{
  token: InjectionToken<T>,
  useFactory: FactoryFunction<T>
}
```

This provider is used to resolve a token given a factory function. The factory function has access to the container.

```typescript
type FactoryFunction<T> = (container: IContainer) => T | Promise<T>;
```

#### Token Provider

```typescript
{
  token: InjectionToken<T>,
  useToken: InjectionToken<T>
}
```

This provider acts like a redirect or an alias, given token 'x' it will resolve instance for token 'y'.

### Register

For using the resolving capabilities of the container first the things have to be registered, to achieve this, there are multiple ways.

By using the decorators [@Singleton](#singleton), [@Transient](#transient) or [@Scoped](#scoped) that will automatically register the classes, or by using some of the next methods available in the container.

#### registerSingleton

Helper to register a singleton class in the container

```typescript
registerSingleton<T>(token: InjectionToken<T>, target: ConstructorType<T> | ClassProvider<T>): IContainer;
```

#### registerTransient

Heper to register a transient class in the container

```typescript
registerTransient<T>(token: InjectionToken<T>, target: ConstructorType<T> | ClassProvider<T>): IContainer;
```

#### registerScoped

Helper to register a scoped class in the container

```typescript
registerScoped<T>(token: InjectionToken<T>, target: ConstructorType<T> | ClassProvider<T>): IContainer;
```

#### registerFactory

Helper to register a factory in the container

```typescript
registerFactory<T>(token: InjectionToken<T>, factory: FactoryFunction<T>): IContainer;
```

#### registerInstance

Helper to register an instance in the container, the instance will be registered as a [Value Provider](#value-provider)

```typescript
registerInstance<T>(token: InjectionToken<T>, instance: T): IContainer;
```

#### registerType

Helper to register a redirect or alias in the container see [Token Provider](#token-provider)

```typescript
registerType<T>(from: InjectionToken<T>, to: InjectionToken<T> | TokenProvider<T>): IContainer;
```

#### registerValue

Helper to register a value in the container, see [Value Provider](#value-provider)

```typescript
registerValue<T>(token: InjectionToken<T>, value: T): IContainer;
```

#### register

Register something in the container

```typescript
  register<T>(
    token: InjectionToken<T>,
    provider: Provider<T> | ConstructorType<T>,
    options?: RegistrationOptions,
  ): IContainer;
```

```typescript
type RegistrationOptions = {
  lifetime: Lifetime;
};
```

#### registerRegistration

Helper to directly register a registration in the container

```typescript
registerRegistration<T>(token: InjectionToken<T>, registration: Registration<T>): IContainer;
```

```typescript
export interface Registration<T> {
  providerType: ProvidersType;
  provider: Provider<T>;
  instance?: T;
  options: RegistrationOptions;
  injections: Array<InjectionToken>;
}
enum ProvidersType {
  ValueProvider,
  ClassProvider,
  FactoryProvider,
  ConstructorProvider,
  TokenProvider,
}
```

#### removeRegistration

It's also possible to remove a specific registration or a group of registrations associated with a token

```typescript
  removeRegistration<T>(
    token: InjectionToken<T>,
    predicate?: (registration: Registration<T>) => boolean,
  ): Promise<IContainer>;
```

This function is only async because the instances of the registrations, if any, can be disposed with `AsyncDispose`

### Resolution

Process to resolve a token into an instance, resolving all the necessary dependencies in between.

#### resolve

The most common method to resolve an object is by using the `resolve()` method.

```typescript
 resolve<T>(token: InjectionToken<T>, scope?: ScopeContext): T;
```

or

```typescript
 resolveAsync<T>(token: InjectionToken<T>, scope?: ScopeContext): Promise<T>;
```

##### Example

```typescript
const obj: TestClass = container.resolve(TestClass);
```

or

```typescript
const obj: TestClass = await container.resolveAsync<TestClass>("testClass");
```

#### resolveAll

To resolve all instances registered for a token it's done using `resolveAll()`

```typescript
 resolveAll<T>(token: InjectionToken<T>, scope?: ScopeContext): Array<T>;
```

or

```typescript
 resolveAllAsync<T>(token: InjectionToken<T>, scope?: ScopeContext): Promise<Array<T>>;
```

##### Example

```typescript
const obj: TestClass[] = container.resolveAll(TestClass);
```

or

```typescript
const obj: TestClass[] = await container.resolveAllAsync<TestClass>("testClass");
```

#### resolveWithArgs

It's also possible to resolve objects with extra arguments, used when the instance should be constructed with some arguments passed into the constructor and some arguments injected.

This method is used with [@AutoInjectable](#autoinjectable) decorator

#### resolveAll

To resolve all instances registered for a token it's done using `resolveAll()`

```typescript
 resolveWithArgs<T>(token: InjectionToken<T>, args?: Array<unknown>, scope?: ScopeContext): T;
```

or

```typescript
 resolveWithArgsAsync<T>(token: InjectionToken<T>, args?: Array<unknown>, scope?: ScopeContext): Promise<T>;
```

##### Example

```typescript
class TestA {}
@AutoInjectable([TestA])
class TestB {
  constructor(
    public hello: string,
    public num: number,
    public a?: TestA,
  ) {}
}
const testB = container.resolveWithArgs<TestB>(TestB, ["test", 1]);
```

or

```typescript
class TestA {}
@AutoInjectable([TestA])
class TestB {
  constructor(
    public hello: string,
    public num: number,
    public a?: TestA,
  ) {}
}
const testB = await container.resolveWithArgsAsync(TestB, ["test", 1]);
```

### Child Containers

#### createChildContainer

It's possible to use child containers to maintain diferrent sets of registrations, but if one registration is not found in the child container the container will try to resolve the token from the parent container.

```typescript
 createChildContainer(): IContainer;

 const childContainer = container.createChildContainer();
```

### Scopes

To use [@Scoped](#scoped) there's the need to create scopes inside the container, this scopes allow for the resolution of instances only inside the defined scope, for example, if there's the need to create a specialized scope to resolve instances on a per-request basis.

```typescript
  createScope(): ScopeContext;

  disposeScope(scope: ScopeContext): Promise<void>;
```

#### createScope

It's used to create a scope where to resolve the dependencies.

#### disposeScope

Is used to dispose one scope.

**NOTE:** This method is async because of the disposition of instances that may implement `AsyncDispose`

### Clearing Instances

It's possible to clean all instances associated with registrations from the container with `clearInstances`

```typescript
clearInstances(): Promise<void>;
```

**NOTE:** This method is async because of the disposition of instances that may implement `AsyncDispose`

### Reset

To clean all the scopes and registrations associated with the container, use `reset()`

```typescript
reset(): Promise<void>;
```

**NOTE:** This method is async because of the disposition of instances that may implement `AsyncDispose`

### Circular Dependencies

Cyclic dependencies are a problem, and should be avoided, but sometimes it's easiest to have them, to solve this problem the container resolves an already existing instance in resolution by creating a proxy of the instance that will later be resolved into the instance.
