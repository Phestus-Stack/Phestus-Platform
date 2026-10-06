---
title: Server API
description: Learn how to create, type, register, and expose HTTP endpoints with the Phestus API Module and API Providers.
tags:
 - phestus
 - api
 - server
 - endpoints
 - providers
 - auth
 - middleware
 - modules
 - typing
 - web stack
 - web framework
 - modular
order: 2
---
# Server API

The Phestus API Module provides the server-side API layer for a Phestus application.

It allows you to define HTTP endpoints as typed objects and register them with the API Module.

The API system separates endpoint definitions from the HTTP framework used to expose them.

An endpoint contains:

* HTTP method
* URL path
* optional middleware
* request types
* handler
* response type

The API Module stores and manages these endpoint definitions.

An **API Provider** is responsible for exposing those endpoints through a concrete HTTP framework such as Express.

This separation allows the API Module to remain independent from the framework used by the application.

## Creating the API Module

The API Module is a normal Phestus module and accepts an API Provider.

For example, an Express application can provide an Express API Provider:

```ts
import { ApiModule } from "@phestus/api-module";
import { ExpressApiProvider } from "@phestus/express-api";

const api = new ApiModule(
    new ExpressApiProvider(app),
);
```

The API Module declares dependencies on the Auth and Middleware modules:

```text
API Module
│
├── Auth Module
└── Middleware Module
```

This allows API endpoints to integrate with authentication and middleware without placing those responsibilities inside the API module itself.

Create the modules independently and register them with Phestus:

```ts
const auth = new AuthModule();

const middleware = new MiddlewareModule();

const api = new ApiModule(
    new ExpressApiProvider(app),
);

const phestus = new Phestus({
    modules: [
        auth,
        middleware,
        api,
    ],

    // service, logger, eventBus, etc.
});
```

After registration, the modules become part of the Phestus runtime and can be resolved through the configured module system.

The API Provider becomes part of the API Module's implementation and is used when the module is initialized.

## Creating an Endpoint

An endpoint is represented by the `ApiEndpoint` type.

```ts
import type {
    ApiEndpoint,
} from "@phestus/api-module";
```

The simplest endpoint looks like this:

```ts
const healthEndpoint: ApiEndpoint = {
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
```

The endpoint can then be registered:

```ts
api.registerEndpoint(healthEndpoint);
```

The API Module stores the endpoint using its HTTP method and path:

```text
GET:/health
```

If another endpoint is registered using the same method and path, the API Module throws an error rather than silently replacing the existing endpoint.

At this point, the endpoint is registered with Phestus but has not necessarily been exposed through an HTTP server yet.

That responsibility belongs to the API Provider.

## API Providers

An API Provider connects the API Module to a concrete HTTP framework.

The provider receives the endpoints registered with the API Module and exposes them through its underlying framework.

The basic provider contract is:

```ts
export interface ApiProvider {
    expose(
        endpoints: ApiEndpoint[],
    ): Promise<void> | void;
}
```

For example, an Express provider can implement this interface:

```ts
import type { Express } from "express";

import type {
    ApiEndpoint,
    ApiProvider,
} from "@phestus/api-module";

export class ExpressApiProvider implements ApiProvider {
    constructor(
        private app: Express,
    ) {}

    expose(endpoints: ApiEndpoint[]): void {
        // Expose endpoints through Express.
    }
}
```

The provider is responsible for translating Phestus API definitions into framework-specific routes.

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
Express
```

This keeps Express-specific behavior out of the API Module.

## Provider Initialization

The API Module exposes its registered endpoints through the configured provider during initialization.

Conceptually, the module performs:

```ts
async initialize(): Promise<void> {
    await this.provider.expose(
        this.getEndpoints(),
    );
}
```

The lifecycle therefore looks like:

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
HTTP routes are registered
```

This means application code only needs to register endpoints with the API Module.

The Phestus runtime handles initialization, and the provider handles framework integration.

## Implementing an Express Provider

An Express API Provider can translate each `ApiEndpoint` into an Express route.

For example:

```ts
import type {
    Express,
    Request,
    Response,
} from "express";

import type {
    ApiEndpoint,
    ApiProvider,
} from "@phestus/api-module";

export class ExpressApiProvider implements ApiProvider {
    constructor(
        private app: Express,
    ) {}

    expose(endpoints: ApiEndpoint[]): void {
        for (const endpoint of endpoints) {
            const handler = async (
                req: Request,
                res: Response,
            ) => {
                const result = await endpoint.handler({
                    body: req.body,

                    params: Object.fromEntries(
                        Object.entries(req.params).map(
                            ([key, value]) => [
                                key,
                                Array.isArray(value)
                                    ? value[0]
                                    : value,
                            ],
                        ),
                    ),

                    query: Object.fromEntries(
                        Object.entries(req.query).map(
                            ([key, value]) => [
                                key,
                                Array.isArray(value)
                                    ? value[0]
                                    : String(value),
                            ],
                        ),
                    ),

                    headers: Object.fromEntries(
                        Object.entries(req.headers).map(
                            ([key, value]) => [
                                key,
                                Array.isArray(value)
                                    ? value[0]
                                    : String(value),
                            ],
                        ),
                    ),
                });

                res
                    .status(result.status)
                    .json(result.data);
            };

            switch (endpoint.method) {
                case "GET":
                    this.app.get(
                        endpoint.path,
                        handler,
                    );
                    break;

                case "POST":
                    this.app.post(
                        endpoint.path,
                        handler,
                    );
                    break;

                case "PUT":
                    this.app.put(
                        endpoint.path,
                        handler,
                    );
                    break;

                case "PATCH":
                    this.app.patch(
                        endpoint.path,
                        handler,
                    );
                    break;

                case "DELETE":
                    this.app.delete(
                        endpoint.path,
                        handler,
                    );
                    break;
            }
        }
    }
}
```

The provider is therefore responsible for two main operations:

1. Registering the route with the framework.
2. Translating the framework request and response into the Phestus API types.

The API Module itself remains unaware that Express is being used.

## HTTP Methods

The API Module supports the standard HTTP methods:

```ts
type ApiMethod =
    | "GET"
    | "POST"
    | "PUT"
    | "PATCH"
    | "DELETE";
```

For example:

```ts
const getUsers: ApiEndpoint = {
    method: "GET",
    path: "/users",

    async handler() {
        // ...
    },
};
```

```ts
const createUser: ApiEndpoint = {
    method: "POST",
    path: "/users",

    async handler(request) {
        // ...
    },
};
```

```ts
const updateUser: ApiEndpoint = {
    method: "PATCH",
    path: "/users/:id",

    async handler(request) {
        // ...
    },
};
```

The same path can therefore have multiple endpoints as long as their methods differ.

```text
GET     /users
POST    /users
PATCH   /users/:id
DELETE  /users/:id
```

The API Provider translates these definitions into the corresponding framework routes.

## Request Types

An API request contains four pieces of information:

```ts
export interface ApiRequest<
    TBody = unknown,
    TParams = Record<string, string>,
    TQuery = Record<string, string>,
> {
    body: TBody;
    params: TParams;
    query: TQuery;
    headers: Record<string, string>;
}
```

This gives handlers access to:

* `request.body`
* `request.params`
* `request.query`
* `request.headers`

Each can be typed independently.

The API Provider is responsible for converting its framework-specific request object into this structure.

## Request Body

Consider a user creation endpoint.

First define the body:

```ts
interface CreateUserBody {
    name: string;
    email: string;
}
```

Then use it as the endpoint body type:

```ts
const createUser: ApiEndpoint<
    CreateUserBody,
    Record<string, string>,
    Record<string, string>,
    User
> = {
    method: "POST",
    path: "/users",

    async handler(request) {
        const user = await userService.create({
            name: request.body.name,
            email: request.body.email,
        });

        return {
            status: 201,
            data: user,
        };
    },
};
```

The handler now knows exactly what the request body contains.

The framework provider is responsible for supplying the framework's request body as `request.body`.

## Path Parameters

Path parameters are defined using `:parameter` syntax.

For example:

```ts
const getUser: ApiEndpoint<
    unknown,
    { id: string },
    Record<string, string>,
    User
> = {
    method: "GET",
    path: "/users/:id",

    async handler(request) {
        const user = await userService.findById(
            request.params.id,
        );

        return {
            status: 200,
            data: user,
        };
    },
};
```

The path:

```text
/users/:id
```

defines an `id` parameter.

The request type:

```ts
{
    id: string;
}
```

describes that parameter to the handler.

A client request would eventually provide:

```ts
{
    params: {
        id: "123",
    },
}
```

The API Provider is responsible for extracting the parameter from the underlying HTTP framework and providing it through `request.params`.

## Query Parameters

Query parameters are separate from path parameters.

For example:

```ts
interface UserQuery {
    search: string;
    limit: string;
}
```

The endpoint can use that type:

```ts
const listUsers: ApiEndpoint<
    unknown,
    Record<string, string>,
    UserQuery,
    User[]
> = {
    method: "GET",
    path: "/users",

    async handler(request) {
        const users = await userService.findMany({
            search: request.query.search,
            limit: Number(request.query.limit),
        });

        return {
            status: 200,
            data: users,
        };
    },
};
```

A request might contain:

```text
GET /users?search=cooper&limit=20
```

The handler receives:

```ts
request.query.search
request.query.limit
```

as strings.

The API Module does not automatically convert query values into numbers, booleans, or other types.

If an endpoint requires a conversion or validation step, that logic can be handled by the endpoint or middleware.

The API Provider is responsible for translating the framework's query representation into the Phestus query representation.

## Headers

Headers are available through:

```ts
request.headers
```

For example:

```ts
const endpoint: ApiEndpoint = {
    method: "GET",
    path: "/profile",

    async handler(request) {
        const authorization =
            request.headers.authorization;

        // ...

        return {
            status: 200,
            data: {},
        };
    },
};
```

Headers are useful for values such as authorization credentials, content negotiation, request identifiers, or other HTTP metadata.

Authentication itself should generally be handled by the Auth Module rather than being implemented independently in every endpoint.

The API Provider is responsible for translating framework-specific headers into the `ApiRequest.headers` structure.

## Responses

Every endpoint returns an `ApiResponse`.

```ts
export interface ApiResponse<T = unknown> {
    status: number;
    data: T;
}
```

For example:

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
```

The API Provider receives the returned `ApiResponse` and translates it into an HTTP response.

For Express, that may be:

```ts
res
    .status(result.status)
    .json(result.data);
```

A typed response can be provided as the fourth generic parameter:

```ts
interface User {
    id: string;
    name: string;
}

const endpoint: ApiEndpoint<
    unknown,
    { id: string },
    Record<string, string>,
    User
> = {
    method: "GET",
    path: "/users/:id",

    async handler(request) {
        const user = await userService.findById(
            request.params.id,
        );

        return {
            status: 200,
            data: user,
        };
    },
};
```

The client can then receive `User` as its response type when it uses the same endpoint definition.

## Middleware

Endpoints can specify middleware using the `middleware` property:

```ts
const getAccount: ApiEndpoint = {
    method: "GET",
    path: "/account",

    middleware: [
        "require-auth",
    ],

    async handler(request) {
        // ...

        return {
            status: 200,
            data: {},
        };
    },
};
```

Middleware names are represented as strings so that the API Module does not need to own the implementation of every middleware behavior.

This allows the Middleware Module to provide reusable request-processing and access-control capabilities.

For example, an application might define middleware for:

```text
require-auth
require-admin
rate-limit
validate-request
logging
```

The exact middleware available to an application depends on the middleware registered with Phestus.

For a complete explanation of middleware creation and registration, see the Middleware documentation.

An API Provider may be responsible for integrating middleware with the underlying framework, but the API Module remains responsible for declaring which middleware an endpoint requires.

## Authentication

Authentication follows the same separation of concerns.

The API Module defines the route:

```ts
const getProfile: ApiEndpoint = {
    method: "GET",
    path: "/profile",

    middleware: [
        "require-auth",
    ],

    async handler(request) {
        // authenticated request

        return {
            status: 200,
            data: {},
        };
    },
};
```

The API Module does not need to implement password handling, sessions, tokens, credentials, or identity storage.

Those responsibilities belong to the Auth Module.

This means the API can remain focused on routing while authentication can evolve independently.

For example:

```text
API Endpoint
     │
     ▼
Middleware
     │
     ▼
Authentication
     │
     ▼
Handler
```

See the Auth documentation for the authentication and authorization model.

## Registering Multiple Routes

An application can create as many endpoints as it needs and register them with the API Module.

```ts
const getUsers: ApiEndpoint = {
    method: "GET",
    path: "/users",

    async handler() {
        return {
            status: 200,
            data: await userService.findMany(),
        };
    },
};

const getUser: ApiEndpoint<
    unknown,
    { id: string },
    Record<string, string>,
    User
> = {
    method: "GET",
    path: "/users/:id",

    async handler(request) {
        const user = await userService.findById(
            request.params.id,
        );

        return {
            status: 200,
            data: user,
        };
    },
};

const createUser: ApiEndpoint<
    CreateUserBody,
    Record<string, string>,
    Record<string, string>,
    User
> = {
    method: "POST",
    path: "/users",

    async handler(request) {
        const user = await userService.create(
            request.body,
        );

        return {
            status: 201,
            data: user,
        };
    },
};

api.registerEndpoint(getUsers);
api.registerEndpoint(getUser);
api.registerEndpoint(createUser);
```

Your application can therefore build an API incrementally:

```text
/users
/users/:id
/orders
/orders/:id
/products
/products/:id
```

without requiring the API Module itself to know anything about the application's domain.

Once the API Module is initialized, its configured provider exposes those endpoints through the application's HTTP framework.

## Finding an Endpoint

The API Module also exposes registered endpoints through `getEndpoint()`.

```ts
const endpoint = api.getEndpoint(
    "GET",
    "/users",
);
```

This allows the surrounding server implementation to resolve a registered endpoint.

The API Module therefore acts as the registry for API contracts, while the API Provider is responsible for translating those contracts into a concrete HTTP server.

The API Module can also expose all registered endpoints:

```ts
const endpoints = api.getEndpoints();
```

The provider uses this collection during module initialization:

```ts
await provider.expose(
    api.getEndpoints(),
);
```

## Creating Another API Provider

The API Provider interface is intentionally small.

A provider only needs to expose the registered endpoint definitions:

```ts
export interface ApiProvider {
    expose(
        endpoints: ApiEndpoint[],
    ): Promise<void> | void;
}
```

This means another framework can be supported without modifying the API Module.

For example, a Fastify provider could implement:

```ts
export class FastifyApiProvider
    implements ApiProvider
{
    constructor(
        private app: FastifyInstance,
    ) {}

    expose(endpoints: ApiEndpoint[]): void {
        for (const endpoint of endpoints) {
            // Translate the endpoint into Fastify.
        }
    }
}
```

The application would then use:

```ts
const api = new ApiModule(
    new FastifyApiProvider(app),
);
```

The endpoint definitions themselves remain unchanged.

This is the primary purpose of the provider abstraction: the API Module defines the capability while the provider defines how that capability is implemented by a specific framework.

## A Complete Example

A small server API can therefore look like this:

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

const api = new ApiModule(
    new ExpressApiProvider(app),
);

const createPost: ApiEndpoint<
    CreatePostBody,
    Record<string, string>,
    Record<string, string>,
    Post
> = {
    method: "POST",
    path: "/posts",

    middleware: [
        "require-auth",
    ],

    async handler(request) {
        const post = await postService.create(
            request.body,
        );

        return {
            status: 201,
            data: post,
        };
    },
};

const getPost: ApiEndpoint<
    unknown,
    { id: string },
    Record<string, string>,
    Post
> = {
    method: "GET",
    path: "/posts/:id",

    async handler(request) {
        const post = await postService.findById(
            request.params.id,
        );

        return {
            status: 200,
            data: post,
        };
    },
};

api.registerEndpoint(createPost);
api.registerEndpoint(getPost);
```

When Phestus initializes the API Module:

```text
ApiModule
    │
    ├── createPost
    └── getPost
          │
          ▼
ExpressApiProvider
          │
          ▼
Express
          │
          ├── POST /posts
          └── GET /posts/:id
```

The important distinction is that the endpoint definitions contain the API contract and application behavior, while the API Provider is responsible for making those endpoints available through HTTP.

This allows the same API definitions to be used with different HTTP frameworks without changing the application-level API.

Once the server API has been created and exposed by a provider, the same endpoint definitions can be consumed by the API Client Module.
