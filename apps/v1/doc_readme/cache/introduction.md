---
title: Cache Module
description: Learn how the Phestus Cache Module provides a simple abstraction for temporary and reusable application data.
tags:
 - phestus
 - cache
 - modules
 - providers
order: 1
---
# Cache Module

The Cache Module provides a simple abstraction for storing and retrieving temporary application data in Phestus.

Caching is useful when an application repeatedly needs data that is expensive to calculate, retrieve, or process. Rather than performing the same operation every time, an application can store the result and reuse it until the cached value is no longer needed.

Phestus does not make assumptions about how caching should be implemented. Instead, the Cache Module defines a small interface that providers implement.

This allows applications to use different caching technologies without changing the code that consumes the cache.

## How Caching Works

The Cache Module exposes five basic operations:

* `get()` retrieves a value.
* `set()` stores a value.
* `delete()` removes a value.
* `has()` checks whether a key exists.
* `clear()` removes all cached values.

A simple example looks like this:

```ts
const cache = <CacheModule>("cache");

await cache.set("user:123", {
    id: "123",
    name: "John",
});

const user = await cache.get("user:123");
```

The module does not determine where `user:123` is stored. That responsibility belongs to the configured cache provider.

## Cache Providers

The Cache Module follows the same provider architecture used throughout Phestus.

The module defines the capability while a provider defines the implementation.

```text
Cache Module
     │
     ▼
Cache Provider
     │
     ├── Memory
     ├── Redis
     ├── Memcached
     └── Custom Implementation
```

A provider could store values in memory for a simple application, Redis for a distributed application, or another caching system entirely.

The application-facing API remains the same regardless of the underlying implementation.

## CacheProvider

Providers implement the `CacheProvider` interface:

```ts
export interface CacheProvider extends PhestusProvider {
    get<T = unknown>(key: string): Promise<T | null>;
    set<T = unknown>(key: string, value: T, options?: CacheSetOptions): Promise<void>;
    delete(key: string): Promise<void>;
    has(key: string): Promise<boolean>;
    clear(): Promise<void>;
}
```

This intentionally provides only a small set of primitives.

The Cache Module does not attempt to define advanced caching strategies. Developers can build those strategies on top of the primitive operations or extend their provider when additional functionality is required.

## Time-to-Live

Values can optionally specify a time-to-live using `CacheSetOptions`.

```ts
export interface CacheSetOptions {
    ttl?: number;
}
```

For example:

```ts
await cache.set("session:123", session, {
    ttl: 300,
});
```

The meaning of the TTL is determined by the provider, but providers should generally interpret it as the amount of time before the cached value expires.

Applications that do not need expiration can simply omit the option.

## The Module

The Cache Module itself is intentionally thin:

```ts
export class CacheModule implements PhestusModule {
    manifest = {
        slug: "cache",
        name: "Cache Module",
        version: "0.1.0",
    };

    constructor(private provider: CacheProvider) {}

    get<T = unknown>(key: string) {
        return this.provider.get<T>(key);
    }

    set<T = unknown>(key: string, value: T, options?: CacheSetOptions) {
        return this.provider.set(key, value, options);
    }

    delete(key: string) {
        return this.provider.delete(key);
    }

    has(key: string) {
        return this.provider.has(key);
    }

    clear() {
        return this.provider.clear();
    }
}
```

The module simply delegates operations to its provider.

This keeps caching infrastructure outside of the module itself and allows providers to control how values are stored, serialized, expired, and distributed.

## When to Use Cache

Caching is particularly useful for data that is:

* Expensive to retrieve.
* Expensive to calculate.
* Requested frequently.
* Safe to temporarily duplicate.
* Not required to be the authoritative source of truth.

For example, an application could cache an API response:

```ts
const cached = await cache.get<ApiResponse>("api:products");

if (cached) {
    return cached;
}

const products = await fetchProducts();

await cache.set("api:products", products, {
    ttl: 60,
});

return products;
```

In this example, the cache acts as an optimization rather than the source of truth. If the cached value disappears, the application can retrieve the data again.

## Cache Is Not a Database

The Cache Module should generally not be treated as the application's primary data store.

Cached data may expire, be cleared, or become unavailable depending on the provider.

A useful architectural distinction is:

```text
Database / Service
       │
       │ authoritative data
       ▼
Application
       │
       │ temporary copy
       ▼
     Cache
```

The cache should normally improve performance rather than become a requirement for the application's data integrity.

## Extending the Cache

The intentionally small API leaves room for developers to build additional abstractions.

For example, an application could build a helper around `get()` and `set()`:

```ts
async function remember<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
) {
    const cached = await cache.get<T>(key);

    if (cached !== null) {
        return cached;
    }

    const value = await factory();

    await cache.set(key, value, { ttl });

    return value;
}
```

More advanced providers could also implement functionality such as namespaces, tags, atomic operations, distributed locking, or specialized serialization.

These features do not need to become part of the core Cache Module.

The goal of the module is to provide a common primitive that other Phestus components and applications can build upon.

## Summary

The Cache Module provides a small and provider-independent interface for temporary application data.

It provides:

* `get()`
* `set()`
* `delete()`
* `has()`
* `clear()`
* Optional TTL support

The module contains no caching technology itself. Providers determine how the cache is implemented.

### This keeps the core abstraction small while allowing Phestus applications and plugins to implement anything from a simple in-memory cache to a distributed caching system.
