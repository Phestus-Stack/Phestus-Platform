---
title: Implementing a Cache Provider
description: Learn how to implement a Cache Provider and register it with the Phestus Cache Module.
tags:
 - phestus
 - cache
 - providers
 - modules
order: 2
---
# Implementing a Cache Provider

The Cache Module does not implement a caching system itself. Instead, it relies on a `CacheProvider` to provide the underlying storage implementation.

This allows developers to choose the caching technology that fits their application.

In this example, we will implement a simple in-memory cache.

The provider will support:

* Getting values.
* Setting values.
* Deleting values.
* Checking whether values exist.
* Clearing the cache.
* Optional TTL expiration.

The same approach can be used to create providers for Redis, Memcached, a database, or another caching system.

## Creating the Provider

Start by importing the Phestus provider type and the Cache Module types.

```ts
import { PhestusProvider } from "@phestus/sdk";
import type { CacheProvider, CacheSetOptions } from "@phestus/cache-module";
```

We can then create our provider:

```ts
export class MemoryCacheProvider implements CacheProvider {
    slug = "memory";

    private cache = new Map<string, {
        value: unknown;
        expiresAt?: number;
    }>();
}
```

The `Map` stores the cached values while `expiresAt` allows the provider to track optional expiration.

## Implementing `get()`

The `get()` method retrieves a value from the cache.

```ts
async get<T = unknown>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
        return null;
    }

    if (entry.expiresAt && Date.now() >= entry.expiresAt) {
        this.cache.delete(key);
        return null;
    }

    return entry.value as T;
}
```

If the key does not exist, the provider returns `null`.

If the value has expired, it is removed and `null` is returned.

Otherwise, the stored value is returned.

## Implementing `set()`

The `set()` method stores a value and optionally calculates its expiration time.

```ts
async set<T = unknown>(
    key: string,
    value: T,
    options?: CacheSetOptions,
): Promise<void> {
    const expiresAt = options?.ttl
        ? Date.now() + options.ttl * 1000
        : undefined;

    this.cache.set(key, {
        value,
        expiresAt,
    });
}
```

In this example, TTL is interpreted as seconds.

For example:

```ts
await cache.set("user:123", user, {
    ttl: 300,
});
```

The value will expire approximately five minutes after it is stored.

The exact TTL behavior is ultimately an implementation detail of the provider.

## Implementing `delete()`

Deleting a value is straightforward:

```ts
async delete(key: string): Promise<void> {
    this.cache.delete(key);
}
```

## Implementing `has()`

The `has()` operation should also account for expiration.

```ts
async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);

    if (!entry) {
        return false;
    }

    if (entry.expiresAt && Date.now() >= entry.expiresAt) {
        this.cache.delete(key);
        return false;
    }

    return true;
}
```

This prevents an expired value from being reported as available.

## Implementing `clear()`

Finally, implement `clear()`:

```ts
async clear(): Promise<void> {
    this.cache.clear();
}
```

The completed provider now looks like this:

```ts
import type {
    CacheProvider,
    CacheSetOptions,
} from "@phestus/cache-module";

export class MemoryCacheProvider implements CacheProvider {
    slug = "memory";

    private cache = new Map<string, {
        value: unknown;
        expiresAt?: number;
    }>();

    async get<T = unknown>(key: string): Promise<T | null> {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        if (entry.expiresAt && Date.now() >= entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.value as T;
    }

    async set<T = unknown>(
        key: string,
        value: T,
        options?: CacheSetOptions,
    ): Promise<void> {
        const expiresAt = options?.ttl
            ? Date.now() + options.ttl * 1000
            : undefined;

        this.cache.set(key, {
            value,
            expiresAt,
        });
    }

    async delete(key: string): Promise<void> {
        this.cache.delete(key);
    }

    async has(key: string): Promise<boolean> {
        const entry = this.cache.get(key);

        if (!entry) {
            return false;
        }

        if (entry.expiresAt && Date.now() >= entry.expiresAt) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    async clear(): Promise<void> {
        this.cache.clear();
    }
}
```

## Creating the Cache Module

The provider can now be passed directly to the Cache Module.

```ts
import { CacheModule } from "@phestus/cache-module";

const cacheProvider = new MemoryCacheProvider();
const cacheModule = new CacheModule(cacheProvider);
```

The module now exposes the provider's functionality through the standard Cache Module API.

## Registering the Module

The Cache Module can be registered with a Phestus host like any other module.

```ts
import { PhestusHost } from "@phestus/sdk";

const phestus = new PhestusHost({
    modules: [
        new CacheModule(
            new MemoryCacheProvider(),
        ),
    ],
});
```

Once the host has been initialized, the module can be retrieved through the Phestus module registry.

```ts
const cache = phestus.getModule("cache");
```

The application can then use the cache without knowing which provider is being used.

```ts
await cache.set("message", "Hello, Phestus!");

const message = await cache.get<string>("message");

console.log(message);
```

## Using TTL

The provider supports optional expiration through the `ttl` option.

```ts
await cache.set(
    "temporary-value",
    {
        value: "Hello",
    },
    {
        ttl: 60,
    },
);
```

The value will be available until the provider determines that the TTL has expired.

```ts
const value = await cache.get("temporary-value");
```

After expiration, `get()` returns `null`.

## Replacing the Provider

The important part of the provider architecture is that the application does not need to change when the caching implementation changes.

For example, an application could initially use:

```ts
new CacheModule(
    new MemoryCacheProvider(),
);
```

and later replace it with:

```ts
new CacheModule(
    new RedisCacheProvider(),
);
```

Application code can continue using:

```ts
const cache = phestus.getModule("cache");

await cache.set("user:123", user);
const value = await cache.get("user:123");
```

The Cache Module provides the stable interface while the provider controls the implementation.

## Building More Advanced Providers

The in-memory provider is intentionally simple.

A production provider could add capabilities specific to its underlying technology.

For example, a Redis provider could support distributed caching across multiple Phestus hosts:

```text
Phestus Host
     │
     ├── Cache Module
     │       │
     │       └── Redis Provider
     │               │
     │               ▼
     │             Redis
     │
     └── Workers
             │
             └── Cache Module
                     │
                     └── Redis Provider
                             │
                             ▼
                           Redis
```

Both the host and workers can then access the same cache.

A provider could also implement additional functionality without requiring those capabilities to become part of the core Cache Module.

## Summary

Creating a Cache Provider requires implementing the `CacheProvider` interface.

The provider is responsible for:

* Storing values.
* Retrieving values.
* Deleting values.
* Checking values.
* Clearing the cache.
* Handling TTL behavior.

The Cache Module is responsible only for exposing those operations through the Phestus module system.

### This separation allows developers to implement caching however they need while keeping application code independent of the underlying caching technology.
