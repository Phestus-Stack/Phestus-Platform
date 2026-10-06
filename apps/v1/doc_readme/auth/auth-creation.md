---
title: Auth Creation
description: Learn how to create an authentication provider and use it with the Phestus Auth Module.
tags:
 - phestus
 - authentication
 - authorization
 - auth
 - providers
 - modules
 - typing
 - web stack
 - web framework
 - modular
order: 2
---

# Auth Creation

The Phestus Auth Module uses providers to implement authentication and authorization.

Creating an authentication implementation therefore consists of creating an `AuthProvider`, implementing its authentication and authorization methods, and passing the provider to the Auth Module.

This approach keeps the authentication implementation separate from the module that exposes it.

## 1. Create an Auth Provider

Start by importing `PhestusProvider` and defining the provider interface:

```ts
import type {
    PhestusProvider,
} from "@phestus/sdk";

import type {
    AuthenticateOptions,
    AuthActor,
    AuthorizeOptions,
    AuthProvider,
} from "@phestus/auth-module";
```

An authentication provider must implement:

```ts
export interface AuthProvider extends PhestusProvider {
    authenticate(
        options: AuthenticateOptions,
    ): Promise<AuthActor | null>;

    authorize(
        options: AuthorizeOptions,
    ): Promise<boolean>;
}
```

A minimal provider can look like this:

```ts
export class ExampleAuthProvider implements AuthProvider {
    slug = "example-auth";
    version = "0.1.0";

    async authenticate(
        options: AuthenticateOptions,
    ): Promise<AuthActor | null> {
        return null;
    }

    async authorize(
        options: AuthorizeOptions,
    ): Promise<boolean> {
        return false;
    }
}
```

The exact provider metadata should follow the `PhestusProvider` definition used by your Phestus SDK version.

## 2. Implement Authentication

The `authenticate()` method receives an `AuthenticateOptions` object:

```ts
async authenticate(
    options: AuthenticateOptions,
): Promise<AuthActor | null> {
    // Authentication logic
}
```

The request is exposed as `unknown`:

```ts
interface AuthenticateOptions {
    request: unknown;
}
```

This allows the provider to remain independent of a particular HTTP framework.

The provider is responsible for understanding the request and determining whether it contains valid authentication information.

For example, a provider could look for an authorization token:

```ts
async authenticate(
    options: AuthenticateOptions,
): Promise<AuthActor | null> {
    const request = options.request as {
        headers?: Record<string, string>;
    };

    const token = request.headers?.authorization;

    if (!token) {
        return null;
    }

    return {
        id: "user_123",
        type: "user",
    };
}
```

In a real provider, the token would be validated against the authentication system before an actor is returned.

The important part of the contract is that successful authentication returns an `AuthActor`, while unsuccessful authentication returns `null`.

## 3. Create an Auth Actor

The `AuthActor` interface defines the identity returned by authentication:

```ts
export interface AuthActor {
    id: string;
    type: string;
    metadata?: Record<string, unknown>;
}
```

A basic actor can be created with an ID and type:

```ts
const actor: AuthActor = {
    id: "user_123",
    type: "user",
};
```

Additional provider-specific information can be placed in `metadata`:

```ts
const actor: AuthActor = {
    id: "user_123",
    type: "user",
    metadata: {
        email: "user@example.com",
    },
};
```

The Auth Module does not impose a specific user model. The provider decides how an authenticated identity is represented.

## 4. Implement Authorization

The second responsibility of the provider is authorization.

The `authorize()` method receives:

```ts
export interface AuthorizeOptions {
    actor: AuthActor;
    action: string;
    resource?: unknown;
    context?: Record<string, unknown>;
    provider?: string;
}
```

A simple authorization implementation might check the requested action:

```ts
async authorize(
    options: AuthorizeOptions,
): Promise<boolean> {
    if (options.action === "posts.read") {
        return true;
    }

    return false;
}
```

The actor is available through `options.actor`:

```ts
async authorize(
    options: AuthorizeOptions,
): Promise<boolean> {
    if (options.actor.type !== "user") {
        return false;
    }

    return true;
}
```

The provider can combine the actor, action, resource, and context to implement whatever authorization rules the application requires.

## 5. Authorize Against a Resource

Authorization can optionally include a resource.

For example:

```ts
const allowed = await auth.authorize({
    actor,
    action: "posts.update",
    resource: post,
});
```

The provider can use the resource when determining whether the actor is allowed to perform the requested action.

```ts
async authorize(
    options: AuthorizeOptions,
): Promise<boolean> {
    if (options.action !== "posts.update") {
        return false;
    }

    const post = options.resource as {
        authorId?: string;
    };

    return post.authorId === options.actor.id;
}
```

This allows authorization to operate at the level of individual resources rather than only checking whether an actor can perform a general action.

## 6. Use Authorization Context

Additional information can be supplied through `context`:

```ts
const allowed = await auth.authorize({
    actor,
    action: "posts.update",
    resource: post,
    context: {
        organizationId: "org_123",
    },
});
```

The provider can use this information when evaluating the authorization request:

```ts
async authorize(
    options: AuthorizeOptions,
): Promise<boolean> {
    const organizationId = options.context?.organizationId;

    if (!organizationId) {
        return false;
    }

    // Authorization logic
    return true;
}
```

The context is intentionally generic so applications can provide information relevant to their own authorization model.

## 7. Create and Register the Auth Module

Once the provider has been implemented, create the Auth Module using that provider.

```ts
const provider = new ExampleAuthProvider();

const auth = new AuthModule(provider);
```

Creating the module does not by itself make it available throughout the Phestus application. Modules are registered with the `Phestus` instance during configuration.

For example:

```ts
const phestus = new Phestus({
    modules: [
        auth,
    ],
    service,
    logger,
    eventBus,
});
```

The `modules` configuration accepts the modules that should be registered with Phestus.

During construction, Phestus registers each configured module with its internal `ModuleRegistry`:

```ts
for (const module of config.modules ?? []) {
    this.modules.register(module);
}
```

Once registered, the Auth Module becomes part of the Phestus runtime and can be retrieved by its manifest slug.

```ts
const auth = phestus.getModule<AuthModule>("auth");
```

The module slug comes from its manifest:

```ts
manifest = {
    slug: "auth",
    name: "Auth Module",
    version: "0.1.0",
};
```

This means the application does not need to maintain a separate reference to the module after registration.

## Using a Registered Module

After retrieving the Auth Module from Phestus, its authentication capabilities can be used normally:

```ts
const auth = phestus.getModule<AuthModule>("auth");

const actor = await auth.authenticate({
    request,
});
```

Authorization can then be performed through the same module:

```ts
if (actor) {
    const allowed = await auth.authorize({
        actor,
        action: "posts.create",
    });
}
```

The important distinction is between **creating a module** and **accessing a registered module**.

```text
Create Provider
      │
      ▼
Create Auth Module
      │
      ▼
Configure Phestus
      │
      ▼
Register Module
      │
      ▼
Phestus Runtime
      │
      ▼
getModule("auth")
      │
      ▼
Use Auth Module
```

This is the standard pattern for modules throughout Phestus.

## Modules Can Also Be Supplied by Plugins

Modules do not have to be provided directly through `config.modules`.

A plugin can supply modules as part of its definition:

```ts
const phestus = new Phestus({
    plugins: [
        authPlugin,
    ],
    service,
    logger,
    eventBus,
});
```

Phestus registers modules supplied by plugins into the same `ModuleRegistry`:

```ts
for (const module of plugin.modules ?? []) {
    this.modules.register(module);
}
```

From the application's perspective, the module can still be retrieved in the same way:

```ts
const auth = phestus.getModule<AuthModule>("auth");
```

This allows modules to be distributed and composed through plugins without changing how the application accesses them.

## Providers and Modules

The provider and module have different roles.

The provider implements the authentication capability:

```text
Auth Provider
     │
     ├── authenticate()
     └── authorize()
```

The Auth Module exposes that capability:

```text
Auth Module
     │
     ├── authenticate()
     └── authorize()
```

Phestus is responsible for registering and making the module available to the application:

```text
Auth Provider
      │
      ▼
Auth Module
      │
      ▼
Phestus
      │
      ▼
Module Registry
      │
      ▼
getModule("auth")
```

The application therefore interacts with the registered module rather than needing to know how or where its provider was created.

## The Standard Phestus Pattern

This pattern is consistent across Phestus modules.

A module is first created and configured:

```ts
const auth = new AuthModule(provider);
```

It is then supplied to Phestus:

```ts
const phestus = new Phestus({
    modules: [
        auth,
    ],
    service,
    logger,
    eventBus,
});
```

Phestus registers it and makes it available through its module registry:

```ts
const auth = phestus.getModule<AuthModule>("auth");
```

The registered module can then be consumed by the application or by other modules that require its capabilities.

This creates a consistent lifecycle for Phestus modules:

```text
Create
  │
  ▼
Configure
  │
  ▼
Register
  │
  ▼
Initialize
  │
  ▼
Retrieve
  │
  ▼
Use
  │
  ▼
Shutdown
```

The Auth Module follows this same lifecycle as every other Phestus module.


## 8. Use Auth with Middleware

Authentication is commonly used from middleware.

For example, an authentication middleware can call the Auth Module:

```ts
const authenticationMiddleware: Middleware = {
    name: "authentication",

    async handle(request, next) {
        const actor = await auth.authenticate({
            request,
        });

        if (!actor) {
            return {
                status: 401,
                data: {
                    message: "Authentication required",
                },
            };
        }

        request.context.actor = actor;

        return next();
    },
};
```

The middleware establishes the actor and stores it in the request context.

A later authorization middleware can then use that actor:

```ts
const authorizationMiddleware: Middleware = {
    name: "authorization",

    async handle(request, next) {
        const actor = request.context.actor as AuthActor;

        const allowed = await auth.authorize({
            actor,
            action: `${request.method}:${request.path}`,
        });

        if (!allowed) {
            return {
                status: 403,
                data: {
                    message: "Forbidden",
                },
            };
        }

        return next();
    },
};
```

The resulting request flow is:

```text
API Request
     │
     ▼
Authentication Middleware
     │
     ├── No Actor ───────► 401
     │
     ▼
Authorization Middleware
     │
     ├── Not Allowed ────► 403
     │
     ▼
Endpoint Handler
     │
     ▼
Response
```

This is one example of how the Auth, Middleware, and API modules can work together without requiring any of them to own the responsibilities of the others.

## 9. Complete Provider Example

A small provider can combine the concepts above:

```ts
export class ExampleAuthProvider implements AuthProvider {
    slug = "example-auth";
    version = "0.1.0";

    async authenticate(
        options: AuthenticateOptions,
    ): Promise<AuthActor | null> {
        const request = options.request as {
            headers?: Record<string, string>;
        };

        const token = request.headers?.authorization;

        if (!token) {
            return null;
        }

        return {
            id: "user_123",
            type: "user",
        };
    }

    async authorize(
        options: AuthorizeOptions,
    ): Promise<boolean> {
        if (options.actor.type !== "user") {
            return false;
        }

        if (options.action === "posts.read") {
            return true;
        }

        if (options.action === "posts.create") {
            return true;
        }

        return false;
    }
}
```

The provider can then be supplied to the Auth Module:

```ts
const auth = new AuthModule(
    new ExampleAuthProvider(),
);
```

The application can now authenticate requests:

```ts
const actor = await auth.authenticate({
    request,
});
```

And authorize actions:

```ts
const allowed = await auth.authorize({
    actor,
    action: "posts.create",
});
```

## Authentication Provider Responsibilities

An Auth Provider is responsible for implementing the authentication system used by the application.

Depending on the provider, this may include:

* Reading credentials from a request.
* Validating credentials.
* Resolving an authenticated actor.
* Determining whether an actor can perform an action.
* Evaluating resources and authorization context.
* Communicating with an external identity system.
* Managing provider-specific authentication rules.

The Auth Module itself does not need to know how any of these operations are implemented.

## Summary

Creating authentication in Phestus follows the provider architecture:

```text
Create AuthProvider
       │
       ▼
Implement authenticate()
       │
       ▼
Return AuthActor
       │
       ▼
Implement authorize()
       │
       ▼
Return boolean
       │
       ▼
Pass Provider to AuthModule
       │
       ▼
Use AuthModule throughout application
```

The result is a small authentication abstraction that can be consumed by other Phestus modules while allowing the underlying authentication implementation to remain replaceable.

The Auth Module defines the capability. The Auth Provider defines the implementation. Middleware and other modules can then consume that capability without depending directly on the provider.
