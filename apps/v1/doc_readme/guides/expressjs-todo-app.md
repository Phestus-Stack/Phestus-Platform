---
title: ExpressJS Backend
description: A practical guide to integrating Phestus with ExpressJS and building a Todo API
tags:
  - phestus
  - expressjs
  - tutorial
  - guide
  - api
  - architecture
  - walkthrough
order: 1
---

## Introduction

This guide walks through integrating **Phestus** into an existing **ExpressJS** application and using that foundation to build a small Todo backend.

The goal is not to teach ExpressJS itself. Instead, we will start with a functional ExpressJS project and progressively introduce Phestus concepts:

- Core Phestus configuration
- Services and data management
- API, Auth, and Middleware modules
- ExpressJS integration
- Schema definition
- API endpoint creation
- Authentication and authorization
- Route-level middleware
- End-to-end testing

By the end of the guide, you will have a small ExpressJS backend with API routes, persistent-in-process data management, authentication, authorization, and middleware working together through Phestus.

> **Scope:** This guide intentionally starts with minimal implementations and adds capabilities incrementally. Some components are deliberately simplified for demonstration purposes.

---

## 1. Creating the Phestus Configuration

Assuming you already have a working ExpressJS project, begin by creating `phestus.config.ts`.

```ts

import { Phestus, PhestusConfig } from '@phestus/core';

export const phestusConfig: PhestusConfig = {
    logger: ,
    service: ,
    eventBus: ,
    modules: [

    ]
}

export const phestus = new Phestus(phestusConfig)

```

The Phestus configuration requires three core components before modules can be introduced:

- `logger`
- `service`
- `eventBus`

These components provide the foundational services that Phestus and its modules depend on.

The following sections implement minimal versions of each component. In a production application, these implementations would normally be connected to the infrastructure and tooling used by the application.

For this walkthrough, we will organize the Phestus code under a `/phestus` directory with three initial subdirectories:

```text
/phestus
  /core
  /modules
  /routes
```

This structure is not mandatory. It is simply the organization used throughout this guide to keep the application easy to navigate as it grows.

---

# 2. Phestus Core Components

Before adding application modules, we need to provide the three core components required by the Phestus configuration.

## 2.1 Logger

The logger provides a consistent interface for output from the Phestus system, including modules, providers, plugins, and services.

For this example, the implementation simply delegates to the native console methods:

```ts

import { Logger } from '@phestus/sdk'

export const logger = {

    debug(message: string, ...args: unknown[]): void {
        console.debug(message, ...args)
    },

    info(message: string, ...args: unknown[]): void {
        console.info(message, ...args)
    },

    warn(message: string, ...args: unknown[]): void {
        console.warn(message, ...args)
    },

    error(message: string, ...args: unknown[]): void {
        console.error(message, ...args)
    },

} satisfies Logger

```

This implementation is intentionally minimal. It is sufficient for the tutorial because it gives Phestus a logger without introducing another logging dependency.

In a larger application, this adapter could instead connect to whatever logging infrastructure the application already uses.

---

## 2.2 Service

The service layer is the primary abstraction Phestus uses to interact with application data.

The implementation shown here is intentionally bare-bones. In a real application, `PhestusService` can act as an adapter over an existing data layer or framework.

For example, if an application were using PayloadCMS, the service adapter could connect to the Payload configuration and expose collection and global operations through the Phestus service interface. This allows modules to query and mutate data without needing to know which underlying CMS, ORM, database, or framework is being used.

For the initial setup, we only need a placeholder implementation:

```ts

import { PhestusService } from '@phestus/sdk'

export const service: PhestusService = {
    schema: {
        async get(collection) {
            return null
        },

        async exists(collection) {
            return false
        },

        async create(collection, schema) { },

        async update(collection, schema) { },

        async ensure(collection, schema) { },

    },

    data: {

        async find(collection, query) {
            return {
                docs: [],
                totalDocs: 0,
                limit: query?.limit ?? 10,
                offset: query?.offset ?? 0,
                hasNextPage: false,
                hasPrevPage: false,
            }
        },

        async findById(collection, id) {
            return null

        },

        async count(collection, query) {
            return 0

        },

        async create<T = unknown>(collection: string, data: unknown): Promise<T> {

            return data as T

        },

        async update<T = unknown>(
            collection: string,
            id: string,
            data: unknown
        ): Promise<T> {
            return data as T
        },

        async delete<T = unknown>(
            collection: string,
            id: string
        ): Promise<T> {
            return null as T
        },
    },
}

```

At this stage, the service does not provide meaningful data operations. We will replace it with the `@phestus/in-memory` service later when the Todo application begins to require actual schema and data management.

---

## 2.3 Event Bus

Phestus is designed around an event-driven architecture, making the event bus an important foundation for communication between modules and other parts of the system.

The event bus is responsible for two primary operations:

- Emitting events
- Subscribing handlers to events

For the initial configuration, we only need the interface:

```ts

import { EventBus } from '@phestus/sdk'

export const eventBus: EventBus = {
    async emit(event) {

    },

    async subscribe(type, handler) {
        return async () => { }
    }
}

```

This implementation does not yet perform any event processing. It simply satisfies the required interface so that the rest of the Phestus system can be initialized.

The event system can be expanded later as the application introduces more complex inter-module communication.

---

## 2.4 Putting the Core Together

With the logger, service, and event bus available, we can now construct the minimum viable Phestus configuration:

```ts
import { logger } from './phestus/core/logger.js';
import { service } from './phestus/core/service.js';
import { eventBus } from './phestus/core/eventBus.js';
import { Phestus, PhestusConfig } from '@phestus/core';

export const phestusConfig: PhestusConfig = {
    logger: logger,
    service: service,
    eventBus: eventBus,
}

export const phestus = new Phestus(phestusConfig)

```

At this point, Phestus has its core dependencies and can be initialized.

The next step is to introduce the modules that will provide the API, authentication, and middleware functionality for our backend.

---

# 3. Creating the Phestus Modules

For this guide, we will use three modules to build the backend:

1. **API Module** — exposes and registers API endpoints.
2. **Auth Module** — handles authentication and authorization.
3. **Middleware Module** — provides reusable request-processing logic.

Together, these modules give us the basic building blocks for an API backend while keeping their responsibilities separate.

---

## 3.1 API Module

The API module is responsible for exposing Phestus endpoints through ExpressJS.

For this guide, we will use the native `@phestus/express-api` provider. The provider translates Phestus API concepts into ExpressJS concepts.

If you want to inspect the provider implementation, it is available in the project's `/packages/providers` directory.

Create the API module as follows:

```ts
import { ApiModule } from '@phestus/api-module'
import { ExpressApiProvider } from '@phestus/express-api'
import { app } from '../../../app.js'
import { middleware } from '../middleware/middlewareModule.js'

const express = new ExpressApiProvider(app, middleware)

export const apiModule: ApiModule = new ApiModule(express)
```

The module itself is intentionally simple: the Express provider is constructed with the application's Express instance and then passed into the `ApiModule`.

This separation is important. The API module defines the framework-independent API behavior, while the provider handles the framework-specific integration.

We are importing the middleware module from our middleware file which we will be working on next.

---

## 3.2 Auth Module

The Auth module delegates authentication and authorization behavior to an auth provider.

For this initial version, we will use a deliberately simple provider. It authorizes every request and always returns the same test user:

```ts
import { AuthProvider } from '@phestus/auth-module';

export const authProvider: AuthProvider = {
    slug: 'test',
    name: 'Test Provider',
    version: '0.1.0',
    moduleSlug: 'auth',

    async authorize() {
        return true;
    },

    async authenticate() {
        return {
            id: 'test-user',
            type: 'user',
        };
    },
};

```

The provider is responsible for the actual authentication and authorization logic. The module acts as the container that exposes that provider to the rest of the Phestus system.

Create the Auth module with:

```ts
import { AuthModule } from '@phestus/auth-module'
import { authProvider } from './authProvider.js';

export const authModule: AuthModule = new AuthModule(authProvider)

```

This is enough to get the Auth module running. It is not intended to provide real security yet; we will replace the placeholder behavior with a simple data-backed implementation later in the guide.

---

## 3.3 Middleware Module

The Middleware module is even simpler to initialize. We create the module and can then register middleware methods against it:

```ts
import { MiddlewareModule } from '@phestus/middleware-module'

export const middleware = new MiddlewareModule()

```

The module will become more useful once we introduce authentication and authorization middleware.

---

## 3.4 Putting the Modules Together

With all three modules configured, we can complete the Phestus configuration:

```ts
import { logger } from './phestus/core/logger.js';
import { service } from './phestus/core/service.js';
import { eventBus } from './phestus/core/eventBus.js';
import { apiModule } from './phestus/modules/api/apiModule.js';
import { Phestus, PhestusConfig } from '@phestus/core';
import { authModule } from './phestus/modules/auth/authModule.js';
import { middleware } from './phestus/modules/middleware/middlewareModule.js';

export const phestusConfig: PhestusConfig = {
    logger: logger,
    service: service,
    eventBus: eventBus,
    modules: [
        apiModule,
        authModule,
        middleware
    ]
}

export const phestus = new Phestus(phestusConfig)
```

The API module depends on the authentication and middleware capabilities introduced in this guide. Keeping these responsibilities in separate modules allows the API layer to remain focused on exposing endpoints while authentication and request processing remain independently configurable.

At this point, the Phestus side of the application is configured. We can now connect it to ExpressJS.

---

# 4. ExpressJS and Phestus Setup

For this guide, the Express application itself lives in `app.ts`, while the core logic for phestus, the routes, middleware, and more live inside of the `index.ts` file

## 4.1 Express Application

The application file creates the Express instance and enables JSON request parsing:

```ts
import express from 'express';

export const app = express();

app.use(express.json());

```

Keeping the Express application separate from the startup script gives us a clean place to configure Express-specific behavior while allowing `index.ts` to focus on application initialization.

---

## 4.2 Initializing Phestus

Phestus is initialized from the application's entry point:

```ts
import { phestus } from './phestus.config.js'
import { app } from './app.js'

await phestus.initialize()

const port = 3000;

app.listen(port, () => {
    console.log(`Express started on port ${port}`);

});

```

The important sequence here is:

1. Import the configured Phestus instance.
2. Import the Express application.
3. Initialize Phestus.
4. Start the Express server.

Once this is running, the framework setup is complete. From here onward, we can focus on building the actual Todo backend.

---

# 5. Building the Todo Backend

The remainder of this guide builds the application in several stages:

1. Create a health route.
2. Introduce a usable service layer.
3. Define users and Todo schemas.
4. Create user and Todo endpoints.
5. Add authentication.
6. Add authorization.
7. Attach authentication and authorization middleware.
8. Test the completed flow.

---

# 6. Routes

A health endpoint is a useful first route because it provides a simple way to verify that the backend is running and that the API module is correctly connected to Express.

## 6.1 Creating the Health Route

Create a `routes` directory inside `/phestus` and place your route definitions there.

A Phestus API endpoint is defined using the `ApiEndpoint` interface:

```ts

import { ApiEndpoint } from '@phestus/api-module';

export const healthEndpoint: ApiEndpoint = {
    method: "GET",
    path: "/health",
    async handler() {
        console.log("HEALTH ROUTE HIT")
        return {
            status: 200,
            data: {
                status: "ok",
            },
        };
    },
};

```

There are four important pieces to this endpoint:

1. **Endpoint type** — `ApiEndpoint` defines the structure expected by the API module.
2. **Method** — specifies the HTTP method, in this case `GET`.
3. **Path** — specifies `/health`.
4. **Handler** — contains the logic that runs when the endpoint is called.

The handler returns a standard Phestus response containing a status code and response data.

---

## 6.2 Registering the Endpoint

Once the endpoint exists, retrieve the API module from the Phestus instance:

```ts
const api = phestus.getModule<ApiModule>('api')
```

After obtaining the module, register the endpoint:

```ts
api.registerEndpoint(healthEndpoint)
```

If everything is configured correctly, visiting:

```text
http://localhost:3000/health
```

should return a `200` response with:

```json
{
  "status": "ok"
}
```

Additional endpoints can be registered in the same way by passing them to `api.registerEndpoint(...)`.

---

# 7. Service Extension

## 7.1 Introducing the In-Memory Service

The placeholder service we created earlier is sufficient for initialization, but it is not enough for an application that needs schemas and real data operations.

Phestus provides `@phestus/in-memory`, a simple service implementation that stores and manages data in memory.

For this tutorial, replacing the initial service adapter is as simple as:

```ts
import { inMemoryService } from '@phestus/in-memory'

export const service = inMemoryService
```

This gives the application a working service layer without requiring a database.

> **Note:** The in-memory service is intended for this walkthrough. Its data is held in memory and is therefore not a substitute for a production persistence layer.

---

## 7.2 Defining the User Schema

With a functional service in place, we can begin defining the application's data models.

The first collection is `users`:

```ts
await service.schema.ensure('users', {
    slug: 'users',
    name: 'User',
    version: '0.1.0',
    fields: {
        username: { type: 'string', required: true, unique: true },
        firstname: { type: 'string', required: true },
        lastname: { type: 'string', required: true },
        password: { type: 'string', required: true },
    },
})
```

The user schema contains:
- `username` — required and unique
- `firstname` — required
- `lastname` — required
- `password` — required

The schema gives the service layer enough information to understand the shape of user records.

---

## 7.3 Defining the Todo Schema

The second collection is `todos`:

```ts
await service.schema.ensure('todos', {
    slug: 'todos',
    name: 'Todo',
    version: '0.1.0',
    fields: {
        name: { type: 'string', required: true, },
        contents: { type: 'text', required: true, },
        author: {
            type: 'relationship', required: true, relation: { collection: 'users', },
        },
    },
})

```

The Todo schema contains:

- `name`
- `contents`
- `author`

The `author` field is a relationship to the `users` collection. This establishes the relationship between a Todo and the user who created it.

---

# 8. Extending the API

Now that the service has schemas, we can use it from API endpoints.

## 8.1 Defining Types

Before creating the user endpoint, define the request and response types:

```ts
type CreateUserBody = {
    username: string
    firstname: string
    lastname: string
    password: string
}

type User = {
    id: string
    username: string
    firstname: string
    lastname: string
    password: string
}

```

`CreateUserBody` represents the data expected in the request body.

`User` represents the user record returned by the service.

These types allow the API endpoint to describe its input and output at compile time.

---

## 8.2 Creating the User Endpoint

The endpoint can now use the service layer to create a user:

```ts

export const createUserEndpoint: ApiEndpoint<
    CreateUserBody, // Body
    Record<string, string>, // Params 
    Record<string, string>, // Query
    User // Response
> = {
    method: 'POST',
    path: '/create-user',

    async handler(request) {
        console.log('Creating user')
        const user = await service.data.create<User>('users', {
            username: request.body.username,
            firstname: request.body.firstname,
            lastname: request.body.lastname,
            password: request.body.password,
        })

        return {
            status: 201,
            data: user,
        }
    },
}

```

This endpoint demonstrates one of the key ideas behind the Phestus architecture: the route interacts with the service interface rather than directly interacting with a database implementation.

The endpoint does not need to know whether the underlying data is stored in PostgreSQL, handled by an ORM, managed by a CMS, or provided by another service implementation.

The API remains decoupled from the underlying data technology.

---

## 8.3 Registering the User Endpoint

The service schema must exist and the endpoint must be registered during application startup:

```ts
import { phestus } from './phestus.config.js'
import { app } from './app.js'
import { createUserEndpoint, healthEndpoint } from './phestus/routes/index.js'
import { ApiModule } from '@phestus/api-module';
import { service } from './phestus/utils/index.js'

await phestus.initialize()

await service.schema.ensure('users', {
    slug: 'users',
    name: 'User',
    version: '0.1.0',
    fields: {
        username: { type: 'string', required: true, unique: true },
        firstname: { type: 'string', required: true },
        lastname: { type: 'string', required: true },
        password: { type: 'string', required: true },
    },
})

const api = phestus.getModule<ApiModule>('api')

api.registerEndpoint(healthEndpoint)
   api.registerEndpoint(createUserEndpoint)

const port = 3000;

app.listen(port, () => {
    console.log(`Express started on port ${port}`);

});
```

The important operations here are:

1. Initialize Phestus.
2. Ensure the `users` schema exists.
3. Retrieve the API module.
4. Register the health endpoint.
5. Register the user endpoint.
6. Start Express.

The user endpoint can now be tested from a PowerShell terminal in VS Code:

```curl
$body = @{
    username = "test-user"
    firstname = "Add"
    lastname = "Min"
    password = "secret"
} | ConvertTo-Json
Invoke-RestMethod `
    -Uri "http://localhost:3000/create-user" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

If the endpoint is configured correctly, the request will create a user and return the created record.

---

# 9. Creating Todos

With user creation working, we can repeat the same pattern for the Todo collection.

## 9.1 Todo Schema

The Todo schema is:

```ts
await service.schema.ensure('todos', {
    slug: 'todos',
    name: 'Todo',
    version: '0.1.0',
    fields: {
        name: { type: 'string', required: true, },
        contents: { type: 'text', required: true, },
        author: {
            type: 'relationship', required: true, relation: { collection: 'users', },
        },
    },
})

```

The relationship between `author` and `users` is important because it gives us the information required to associate a Todo with the user who created it.

---

## 9.2 Todo Endpoint

The initial Todo endpoint follows the same pattern as the user endpoint:

```ts
export const createToDoEndpoint: ApiEndpoint<
    CreateToDoBody,
    Record<string, string>,
    Record<string, string>,
    ToDo
> = {
    method: 'POST',
    path: '/create-todo',

    async handler(request) {
        console.log('Creating todo')

        const todos = await service.data.create<ToDo>('todos', {
            name: request.body.name,
            contents: request.body.contents,
            author: request.body.author,
        })

        return {
            status: 201,
            data: todos,
        }
    },
}
```

At this stage, the client supplies the author directly.

That is useful for demonstrating the service and API layers, but it is not ideal from a security perspective. A client should not be trusted to tell the server which user they are acting as.

The authentication and middleware sections will address this by deriving the author from the authenticated request instead.

---

## 9.3 Testing Todo Creation

The endpoint can be tested with:

```curl
$body = @{
    name = "Implement Phestus"
    contents = "Finish this article and read the documentation"
    author = "test-user"
} | ConvertTo-Json
Invoke-RestMethod `
    -Uri "http://localhost:3000/create-todo" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

At this point, the application can create users and Todos, but there is not yet a meaningful security boundary around those operations.

---

# 10. Adding Authentication

We can now make the request flow more intelligent by determining which user is making a request.

For this demonstration, authentication will be intentionally simple: the request body contains the user's password.

> **Security note:** Passing a plaintext password through the body on every request is only suitable for this demonstration. A production authentication system should use an appropriate mechanism such as secure cookies, sessions, or tokens, together with proper password handling and transport security.

## 10.1 Authentication

The `authenticate()` method is responsible for identifying the actor associated with a request.

Expand the authentication method in the auth provider:

```ts
async authenticate(options: AuthenticateOptions) {

        if (!options.request) {
            return null
        }

        const request = options.request as TestAuthRequest
        const password = request.body?.password

        if (!password) {
            return null
        }

        const result = await service.data.find<User>('users', {
            where: {
                fields: {
                    password: {
                        equals: password,
                    },
                },
            },
            limit: 1,
        })

        const user = result.docs[0]

        if (!user) {
            return null
        }

        return {
            id: user.id,
            type: 'user',
            metadata: {
                id: user.id,
                username: user.username,
                firstname: user.firstname,
                lastname: user.lastname,
            }
        }
    },
```

The method:
1. Verifies that a request exists.
2. Reads the password from the request body.
3. Queries the `users` collection.
4. Finds the matching user.
5. Returns an auth actor containing the user's identity and metadata.

The request shape used by this provider is represented by:

```ts
type TestAuthRequest = {
    body?: {
        password?: string
    }
}

```

The resulting actor gives the rest of the system a consistent representation of the authenticated user.

This becomes especially useful when the application eventually has multiple actor types, because the actor's `type` can be used to distinguish who is performing an action.

---

# 11. Authorization

Authentication answers:

> **Who are you?**

Authorization answers:

> **Are you allowed to perform this action?**

For this example, the application has three authorization rules:

1. Anyone can create a user.
2. An authenticated user can create a Todo.
3. A user can read a Todo only when they are the owner of that Todo.

The provider can express those rules through `authorize()`:

```ts
async authorize(options: AuthorizeOptions) {
    if (options.action === 'create-user') {
        return true
    }

    if (options.actor && options.action === 'create-todo') {
        return true
    }

    if (!options.actor || !options.resource) {
        return false
    }

    const todo = options.resource as ToDo

    if (options.action === 'read-todo' && options.actor.id === todo.author) {
       return true
    }

    return false
},

```

This keeps authorization decisions centralized in the auth provider rather than embedding access-control logic directly into every endpoint.

As the application grows, this pattern can be expanded with more actions, actor types, roles, permissions, and resource-level checks.

---

# 12. Setting Up Middleware

With authentication and authorization available, we need a way to run them as part of the request lifecycle.

Phestus allows middleware to be attached to API endpoints, giving us a natural place to perform these checks.

## 12.1 Authentication Middleware

The authentication middleware determines who is making the request.

```ts
const authenticateMiddleware: Middleware = {
    name: 'authentication',

    async handle(request, next, options) {
        const actor = await authModule.authenticate({
            request,
        })

        if (!actor) {
            return {
                status: 401,
                data: {
                    error: 'Unauthorized',
                },
            }
        }

        request.context = {
            ...request.context,
            actor,
        }

        return next()
    },
}
```

The middleware:

1. Calls the Auth module's `authenticate()` method.
2. Returns `401 Unauthorized` if authentication fails.
3. Stores the resulting actor in `request.context`.
4. Passes control to the next middleware or endpoint.

Storing the actor in the request context makes the authenticated identity available to subsequent middleware and the endpoint handler.

---

## 12.2 Authorization Middleware

Authentication identifies the actor. Authorization determines whether that actor can perform the requested action.

```ts
export const authorizationMiddleware: Middleware = {
    name: 'authorization',
    
    async handle(request, next, options) {
        const action = options?.action as string;
        const actor = request.context.actor as AuthActor;
        const authorized = await authModule.authorize({
            actor,
            action,
            context: request.context,
        });

        if (!authorized) {
            return {
                status: 403,
                data: {
                    error: 'Forbidden',
                },
            };
        }

        return next();
    },
}

```

This middleware:

1. Reads the action from the middleware options.
2. Reads the authenticated actor from the request context.
3. Calls the Auth module's `authorize()` method.
4. Returns `403 Forbidden` if the action is not allowed.
5. Continues the request if authorization succeeds.

The distinction between `401` and `403` is useful here:

- **401 Unauthorized** — the request could not be authenticated.
- **403 Forbidden** — the actor is known, but is not permitted to perform the action.

---

# 13. Protecting the Todo Endpoint

We can now update the Todo endpoint so that the client no longer supplies the author directly.

Instead, the route will:

1. Authenticate the request.
2. Authorize the `create-todo` action.
3. Read the authenticated actor from the request context.
4. Use that actor's ID as the Todo author.

The protected endpoint is:

```ts
export const createToDoEndpoint: ApiEndpoint<
    CreateToDoBody,
    Record<string, string>,
    Record<string, string>,
    ToDo
> = {
    method: 'POST',
    path: '/create-todo',
    middleware: [
        {
            name: "authentication",
        },
        {
            name: "authorization",
            options: {
                action: "create-todo",
            },
        },
    ],

    async handler(request) {
        const actor = request.context.actor as AuthActor
        const todo = await service.data.create<ToDo>('todos', {
            name: request.body.name,
            contents: request.body.contents,
            author: actor.id,
        })

        return {
            status: 201,
            data: todo,
        }
    }
}

```

This is an important architectural transition.

Previously, the client could submit:

```text
author = "some-user"
```

and the API would trust it.

With authentication middleware in place, the server determines the author from the authenticated actor instead. The client no longer gets to choose which user owns the newly created Todo.

---

# 14. Registering the Middleware and Final Application Setup

The last step is to register the middleware methods and endpoints during application startup.

The complete `index.ts` used in this stage is:

```ts
import { phestus } from './phestus.config.js'
import { app } from './app.js'
import { createToDoEndpoint, createUserEndpoint, healthEndpoint } from './phestus/routes/index.js'
import { ApiModule } from '@phestus/api-module';
import { AuthModule } from '@phestus/auth-module';
import { MiddlewareModule } from '@phestus/middleware-module';
import { authenticateMiddleware, authorizationMiddleware } from './phestus/modules/middleware/methods.js';

await phestus.initialize()
export const service = phestus.getService()
export const authModule = phestus.getModule<AuthModule>('auth')

const api = phestus.getModule<ApiModule>('api')
const middleware = phestus.getModule<MiddlewareModule>('middleware')

await service.schema.ensure('users', {
    slug: 'users',
    name: 'User',
    version: '0.1.0',
    fields: {
        username: { type: 'string', required: true, unique: true },
        firstname: { type: 'string', required: true },
        lastname: { type: 'string', required: true },
        password: { type: 'string', required: true },
    },
})

await service.schema.ensure('todos', {
    slug: 'todos',
    name: 'Todo',
    version: '0.1.0',
    fields: {
        name: { type: 'string', required: true, },
        contents: { type: 'text', required: true, },
        author: {
            type: 'relationship', required: true, relation: { collection: 'users', },
        },
    },
})

middleware.use(authorizationMiddleware)
middleware.use(authenticateMiddleware)

api.registerEndpoint(healthEndpoint)
api.registerEndpoint(createUserEndpoint)
api.registerEndpoint(createToDoEndpoint)

const port = 3000;

app.listen(port, () => {
    console.log(`Express started on port ${port}`);
});

```

There are now several responsibilities being coordinated during startup:

- Initialize Phestus.
- Retrieve the service.
- Retrieve the Auth module.
- Retrieve the API module.
- Retrieve the Middleware module.
- Ensure the `users` and `todos` schemas exist.
- Register authorization middleware.
- Register authentication middleware.
- Register API endpoints.
- Start Express.

The application is now using the full flow:

```text
Express
   │
   ▼
API Module
   │
   ▼
Middleware
   ├── Authentication
   │       │
   │       ▼
   │    Auth Module
   │
   └── Authorization
           │
           ▼
       Auth Module
           │
           ▼
      Route Handler
           │
           ▼
       Service Layer
```

This illustrates the main architectural benefit of the approach: each concern remains separated while the modules can work together as part of a single request lifecycle.

---

# 15. Testing the Protected Endpoint

The Todo request now needs to include the password so the authentication middleware can identify the user:

```curl
$body = @{
    name = "Implement Phestus"
    contents = "Finish this article and read the documentation"
    author = "test-user"
    password = "secret"
} | ConvertTo-Json
Invoke-RestMethod `
    -Uri "http://localhost:3000/create-todo" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

If the credentials are valid, the authentication middleware establishes the actor, the authorization middleware confirms that the actor can perform `create-todo`, and the endpoint creates the Todo using the authenticated actor's ID.

An invalid or missing password should result in an authentication failure rather than allowing the request to continue to the endpoint.

---

# 16. What We Built

By following this guide, the application now contains the core pieces of a small Phestus-powered ExpressJS backend:

### Core

- Phestus configuration
- Logger
- Service adapter
- Event bus

### Modules

- API module
- Auth module
- Middleware module

### ExpressJS Integration

- Express application
- Phestus initialization
- API provider integration

### Data Layer

- In-memory service
- User schema
- Todo schema
- User/Todo relationship

### API

- Health endpoint
- User creation endpoint
- Todo creation endpoint

### Security

- Authentication
- Authorization
- Authentication middleware
- Authorization middleware
- Resource ownership checks

---

# 17. Next Steps

This Todo application is intentionally small, but the same architecture can be expanded considerably.

Some natural next steps would be:

- Replace the in-memory service with a production data adapter.
- Replace the demonstration authentication flow with sessions, cookies, or tokens.
- Add password hashing and credential management.
- Add Todo retrieval and update endpoints.
- Add resource-level authorization to additional operations.
- Move schema initialization into dedicated application modules.
- Move endpoint registration into feature-specific modules.
- Expand the event bus for inter-module communication.
- Add structured logging.
- Add additional ExpressJS providers or adapters where appropriate.

The important idea is that these additions can be made without requiring every module to know the implementation details of the others.

---

# Conclusion

This guide demonstrated how to take a basic ExpressJS application and incrementally introduce Phestus as a modular backend architecture.

We started with the three required core components, added the API, Auth, and Middleware modules, connected them to ExpressJS, introduced a service-backed data model, and finally built authentication and authorization into the request lifecycle.

The resulting system is intentionally simple, but it demonstrates the central concepts behind the platform:

- **Modules** provide isolated capabilities.
- **Providers** connect those capabilities to specific implementations.
- **Services** abstract data operations away from the underlying infrastructure.
- **Middleware** controls request processing.
- **Authentication** establishes identity.
- **Authorization** controls access.
- **API endpoints** expose application behavior through a consistent interface.

The result is a backend that can evolve without tightly coupling every feature to ExpressJS, a particular database, or a specific authentication implementation.

That separation is the foundation on which larger Phestus applications can be built.
