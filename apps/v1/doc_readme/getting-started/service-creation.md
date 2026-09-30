---
title: Service Creation
description: A guide on how to integrate a service adapter and implement the service layer.
tags:
  - phestus
  - service adapter
  - service layer
  - web stack
  - web framework
  - modular
order: 5
---

## Creating a Service

The Phestus Service provides an abstraction between Phestus and the underlying data system used by your application.

Instead of Phestus modules directly depending on a specific database, CMS, or ORM, they interact with the `PhestusService` interface.

This allows the same Phestus modules to work with different implementations of your application's data layer.

A service contains two primary areas:

* `schema` - Defines and manages Phestus schemas.
* `data` - Provides operations for reading and modifying data.

## Creating a Simple Service

A basic service can be created by implementing the `PhestusService` interface.

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

        async create(collection, schema) {},
        async update(collection, schema) {},
        async ensure(collection, schema) {},
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

This example is only a basic implementation. In a real application, these methods would connect to your database, CMS, ORM, or another data source.

## Adding the Service to Phestus

The service is provided through the `PhestusConfig`:

```ts
import type { PhestusConfig } from '@phestus/sdk'

export const config: PhestusConfig = {
    service,
    logger,
    eventBus,
}
```

Phestus then provides the service to modules through the `PhestusContext`.

```ts
const context: PhestusContext = {
    service,
    logger,
    eventBus,
}
```

Modules can use the service without needing to know what system is actually providing the data.

For example:

```ts
const result = await context.service.data.find(
    'users',
    {
        limit: 10,
    },
)
```

The module only knows that it is using the `PhestusService` interface. The actual implementation could be backed by Payload, PostgreSQL, Redis, an ORM, or another system.

## Next Steps

The service system provides much more functionality than this basic implementation. The Services section covers:

* Data queries and operators
* Creating and managing schemas
* Service adapters
* Data operations
* Schema validation
* Building custom service implementations
