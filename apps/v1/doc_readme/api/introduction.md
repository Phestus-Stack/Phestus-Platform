---
title: Introduction
description: An introduction to the Phestus API architecture, API providers, and the separation between server endpoints and API clients.
tags:
 - phestus
 - api
 - api-client
 - api-providers
 - providers
 - modules
 - typing
 - web stack
 - web framework
 - modular
order: 1
---

# Introduction

The Phestus API system provides a typed and modular way to define, expose, and consume functionality from a Phestus application.

Rather than making the API layer a large framework-specific system, Phestus separates the responsibilities into three parts:

* **API Module** — defines and registers server endpoints.
* **API Provider** — exposes those endpoints through a specific server or web framework.
* **API Client Module** — provides a client for communicating with those endpoints.

This separation allows the API definition to remain independent from the underlying HTTP framework.

For example, an application can define an endpoint using the Phestus API Module and expose it through Express using an Express API Provider. The same API Module could later be exposed through another framework without changing the endpoint definitions themselves.

The goal is to make APIs another composable capability of the Phestus platform rather than something that requires a large collection of framework-specific abstractions.

## The API Architecture

The API system can be thought of as three distinct layers:

```text
┌─────────────────────────┐
│      Client App         │
│                         │
│    API Client Module    │
└────────────┬────────────┘
             │ HTTP
             ▼
┌─────────────────────────┐
│      Server App         │
│                         │
│       API Module        │
│                         │
│   Endpoint Definitions  │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│      API Provider       │
│                         │
│   Express / Fastify /   │
│   Other HTTP Framework  │
└─────────────────────────┘
```

The **API Module** defines what the application exposes.

The **API Provider** determines how those endpoints are actually exposed to the outside world.

The **API Client Module** is responsible for making requests to those endpoints.

This distinction is important because the API Module does not need to know whether the application is using Express, Fastify, NestJS, or another HTTP server.

## The API Module

The API Module provides the core API capability.

It maintains a collection of registered endpoint definitions:

```ts
const endpoint: ApiEndpoint = {
    method: "GET",
    path: "/health",

    async handler() {
        return {
            status: 200,
            data: {
                status: "ok",
            },
        };
    },
};

api.registerEndpoint(endpoint);
```

The module is responsible for storing and managing these definitions.

It does not directly call:

```ts
app.get(...)
app.post(...)
app.put(...)
```

or any other framework-specific API.

Instead, those responsibilities belong to the configured API Provider.

This keeps the module independent of the server framework.

## API Providers

An API Provider is the bridge between the Phestus API Module and an HTTP framework.

The provider receives the endpoints registered with the API Module and exposes them through its underlying framework.

Conceptually:

```text
ApiModule
    │
    │ registered endpoints
    ▼
ApiProvider
    │
    │ framework-specific registration
    ▼
HTTP Framework
```

For example, an Express provider can translate a Phestus endpoint:

```ts
{
    method: "GET",
    path: "/health",
    handler: ...
}
```

into the equivalent Express route:

```ts
app.get("/health", handler);
```

The API Module does not need to know that Express exists.

Likewise, an Express provider does not need to define application endpoints itself. It simply exposes the endpoints provided by the API Module.

## Why Use Providers?

Phestus uses providers to keep modules independent from concrete implementations.

If the API Module directly depended on Express, the module would effectively become an Express module.

That would create several problems.

An application using Fastify would need a different API Module.

An application using another HTTP framework would need another implementation.

The API abstraction would therefore be tied to the framework that happened to be chosen first.

Providers avoid this.

The API Module defines the capability:

```text
API
│
└── Define endpoints
```

while the provider defines the implementation:

```text
Express API Provider
│
└── Expose endpoints through Express
```

This means the same API Module can work with multiple providers:

```text
                    ┌── Express API Provider
                    │
ApiModule ───────────┼── Fastify API Provider
                    │
                    └── Other API Provider
```

The endpoint definitions do not need to change.

## Implementing an API Provider

An API provider only needs to implement the API provider contract.

The basic provider interface is:

```ts
export interface ApiProvider {
    expose(
        endpoints: ApiEndpoint[],
    ): Promise<void> | void;
}
```

The provider receives the endpoints registered by the API Module.

It can then translate those definitions into whatever framework it is responsible for.

For example, an Express provider can receive an Express application:

```ts
export class ExpressApiProvider implements ApiProvider {
    constructor(
        private app: Express,
    ) {}

    expose(endpoints: ApiEndpoint[]): void {
        // Register endpoints with Express.
    }
}
```

The provider can then iterate over the endpoints:

```ts
expose(endpoints: ApiEndpoint[]): void {
    for (const endpoint of endpoints) {
        // Register endpoint with Express.
    }
}
```

The provider is responsible for translating the Phestus request and response structures into the structures expected by the underlying framework.

For example, an Express provider may convert an Express request into an `ApiRequest`:

```ts
const result = await endpoint.handler({
    body: req.body,
    params: req.params,
    query: req.query,
    headers: req.headers,
});
```

The provider then converts the resulting `ApiResponse` back into an HTTP response:

```ts
res
    .status(result.status)
    .json(result.data);
```

This translation is the primary responsibility of an API Provider.

## Provider-Specific Logic

Providers are intentionally allowed to contain framework-specific logic.

For example, an Express provider can use:

```ts
req.body
req.params
req.query
req.headers
res.status(...)
res.json(...)
```

That code does not belong in the API Module because it is specific to Express.

The API Module instead works with the framework-independent structures:

```ts
ApiRequest
ApiResponse
ApiEndpoint
ApiProvider
```

This creates a clear boundary:

```text
┌──────────────────────────────┐
│       Phestus API            │
│                              │
│ ApiEndpoint                  │
│ ApiRequest                   │
│ ApiResponse                  │
│ ApiProvider                  │
└──────────────┬───────────────┘
               │
               │ Provider boundary
               ▼
┌──────────────────────────────┐
│      Framework-specific      │
│                              │
│ Express                      │
│ req / res                    │
│ app.get / app.post / ...     │
└──────────────────────────────┘
```

This allows framework-specific behavior to remain isolated within the provider.

## Exposing Endpoints During Module Initialization

The API Module exposes its registered endpoints through its provider during initialization.

Conceptually, the module performs:

```ts
async initialize(): Promise<void> {
    await this.provider.expose(
        this.getEndpoints(),
    );
}
```

This means applications only need to register their endpoints with the API Module.

When the Phestus runtime initializes the module, the provider is given the registered endpoints and exposes them through the configured framework.

The lifecycle therefore becomes:

```text
Create API Module
       │
       ▼
Register endpoints
       │
       ▼
Initialize Phestus
       │
       ▼
ApiModule.initialize()
       │
       ▼
ApiProvider.expose()
       │
       ▼
Framework routes are registered
```

This keeps application code focused on defining API behavior while the provider handles server integration.

## Server and Client

The API architecture can therefore be viewed as two sides connected through a provider:

```text
┌──────────────────────┐
│      Client App      │
│                      │
│  API Client Module   │
└──────────┬───────────┘
           │
           │ HTTP
           ▼
┌──────────────────────┐
│      API Provider    │
│                      │
│      Express         │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│      API Module      │
│                      │
│ Endpoint Definitions │
└──────────────────────┘
```

The provider is what connects the framework-independent API definition to the actual HTTP server.

## Why an API Module?

Phestus is designed around modules that provide focused capabilities.

An API should therefore be something that can be installed into a Phestus application rather than something that every application is forced to implement in the same way.

The API Module provides the basic capability to:

* define routes
* register endpoints
* type request bodies
* type path parameters
* type query parameters
* type responses
* attach middleware
* provide endpoint definitions to an API provider

The module does not attempt to dictate how the rest of the application should be structured.

A developer can therefore build an application such as:

```text
Phestus
│
├── Auth Module
├── Middleware Module
├── API Module
├── Event Module
├── Job Module
└── Workflow Module
```

and use those capabilities together.

## Why Separate Auth and Middleware?

Authentication, authorization, and middleware are related to APIs, but they are not the same capability.

The API Module needs to know that an endpoint can have middleware:

```ts
const endpoint: ApiEndpoint = {
    method: "GET",
    path: "/users",

    middleware: [
        "require-auth",
    ],

    async handler(request) {
        // ...
    },
};
```

It should not, however, need to implement the authentication system itself.

Authentication belongs to the **Auth Module**, while reusable request-processing and access-control behavior belongs to the **Middleware Module**.

This allows applications to compose those capabilities:

```text
API
 │
 ├── Endpoint
 │
 ├── Middleware
 │       │
 │       └── Auth
 │
 └── Handler
```

The API Provider can then be responsible for translating the resulting endpoint behavior into the underlying HTTP framework.

This also means that the API Module can remain relatively small.

For information about authentication and authorization, see the Auth documentation.

For information about defining and applying middleware, see the Middleware documentation.

## Typed Endpoints

A major goal of the API system is to keep request and response structures explicit.

An endpoint can define four independent types:

```ts
ApiEndpoint<
    TBody,
    TParams,
    TQuery,
    TResponse
>
```

For example:

```ts
interface CreatePostBody {
    title: string;
    content: string;
}

interface Post {
    id: string;
    title: string;
    content: string;
}

const createPost: ApiEndpoint<
    CreatePostBody,
    Record<string, string>,
    Record<string, string>,
    Post
> = {
    method: "POST",
    path: "/posts",

    async handler(request) {
        const post = await createPostInDatabase(
            request.body,
        );

        return {
            status: 201,
            data: post,
        };
    },
};
```

This makes the API contract explicit.

The body describes data being sent to the server.

Parameters describe values embedded in the URL.

Query values describe values supplied through the query string.

The response describes data returned from the endpoint.

The provider is responsible for translating the underlying framework's request into these types.

## Parameters and Queries

Path parameters are represented directly in the endpoint path.

```ts
const endpoint: ApiEndpoint<
    unknown,
    { id: string },
    Record<string, string>,
    User
> = {
    method: "GET",
    path: "/users/:id",

    async handler(request) {
        const user = await findUser(
            request.params.id,
        );

        return {
            status: 200,
            data: user,
        };
    },
};
```

A request can then provide:

```ts
{
    params: {
        id: "123",
    },
}
```

Query parameters are represented separately:

```ts
const endpoint: ApiEndpoint<
    unknown,
    Record<string, string>,
    {
        limit: string;
        search: string;
    },
    User[]
> = {
    method: "GET",
    path: "/users",

    async handler(request) {
        // request.query.limit
        // request.query.search
        // ...
    },
};
```

The client can provide those values independently:

```ts
await client.request(endpoint, {
    query: {
        limit: "20",
        search: "cooper",
    },
});
```

Keeping these values separate makes the structure of an HTTP request explicit.

## Modules Are Registered With Phestus

The API Module is still a Phestus module.

It is created independently and then registered with the Phestus runtime alongside the other modules used by the application.

An application may provide an API provider when creating the module:

```ts
const api = new ApiModule(
    new ExpressApiProvider(app),
);

const auth = new AuthModule();

const middleware = new MiddlewareModule();

const phestus = new Phestus({
    modules: [
        auth,
        middleware,
        api,
    ],

    // service, logger, eventBus, etc.
});
```

Once the modules have been registered, they become part of the Phestus runtime.

When the runtime initializes the API Module, the configured provider receives the registered endpoints and exposes them through the underlying server.

This is an important part of the Phestus architecture.

The API Module owns the API capability.

The API Provider owns the framework integration.

The Phestus runtime owns the lifecycle.

## API Definitions Are Reusable

An endpoint is an object rather than a framework-specific route declaration.

That makes it possible to use the same definition in multiple places.

For example:

```ts
export interface User {
    id: string;
    name: string;
}

export interface GetUserParams {
    id: string;
}

export const getUser: ApiEndpoint<
    unknown,
    GetUserParams,
    Record<string, string>,
    User
> = {
    method: "GET",
    path: "/users/:id",

    async handler(request) {
        const user = await findUser(
            request.params.id,
        );

        return {
            status: 200,
            data: user,
        };
    },
};
```

The server registers the endpoint:

```ts
api.registerEndpoint(getUser);
```

The configured provider exposes it through the server.

The client can consume the same definition:

```ts
const response = await client.request(
    getUser,
    {
        params: {
            id: "123",
        },
    },
);
```

This provides a shared contract without requiring the client and server to be implemented as one application.

## The API as a Contract

The most important concept in the Phestus API system is that an endpoint represents a contract.

```text
Endpoint
│
├── Method
├── Path
├── Parameters
├── Query
├── Body
├── Middleware
└── Response
```

The API Module defines and stores that contract.

The API Provider exposes that contract through a concrete HTTP implementation.

The server implements the endpoint behavior.

The client consumes the contract.

This keeps the API layer understandable while still allowing applications to build significantly more complex systems around it.

The following articles cover each side of the system in detail:

* **Server API** — creating and registering server endpoints.
* **API Providers** — implementing a provider and exposing endpoints through a web framework.
* **Client API** — consuming those endpoints from a client application.