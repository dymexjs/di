# Child Containers and Scopes

- [Child Containers and Scopes](#child-containers-and-scopes)
  - [Child Containers](#child-containers)
    - [createChildContainer](#createchildcontainer)
  - [Scopes](#scopes)
    - [createScope](#createscope)
    - [dispose scope](#dispose-scope)

## Child Containers

### createChildContainer

It's possible to use child containers to maintain diferrent sets of registrations, but if one registration is not found in the child container the container will try to resolve the token from the parent container.

```typescript
 createChildContainer(): IContainer;

 const childContainer = container.createChildContainer();
```

## Scopes

To use [@Scoped](02-decorators.md##scoped) there's the need to create scopes inside the container, this scopes allow for the resolution of instances only inside the defined scope, for example, if there's the need to create a specialized scope to resolve instances on a per-request basis.

```typescript
  const scope = createScope(): IScopeContext;
```

### createScope

It's used to create a scope where to resolve the dependencies.

### dispose scope

To dispose the scope you need to call the dispose method.

```typescipt
  await scope.dispose();
```

**NOTE:** This method is async because of the disposition of instances that may implement `AsyncDispose`
