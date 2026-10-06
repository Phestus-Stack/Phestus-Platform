---
title: Lifecycle Management
description: A guide on how to manage lifecycles for spinning up and shutting down Phestus
tags:
  - phestus
  - lifecycle
  - initialize
  - shutdown
  - web stack
  - web framework
  - modular
order: 6
---

## Starting Phestus

Once your `PhestusConfig` has been created, you can create and start a Phestus instance.

Creating the `Phestus` instance registers the configured modules, plugins, and providers. The runtime is started by calling `initialize()`.

```ts
import { Phestus } from '@phestus/core'

const phestus = new Phestus({
    service,
    logger,
    eventBus,

    modules: [
        queue,
        event,
    ],

    plugins: [],
})

await phestus.initialize()
```

The `initialize()` method starts the Phestus runtime and initializes the registered components in the appropriate order.

Modules and providers can use their `initialize()` lifecycle methods to establish connections, start consumers, register subscriptions, or perform other startup tasks.

## Managing the Runtime

After initialization, the Phestus instance can be used to access registered modules, providers, and plugins.

```ts
const queue = phestus.getModule<QueueModule>('queue')
const event = phestus.getModule<EventModule>('event')
```

You can also check the current runtime state:

```ts
const state = phestus.getState()
```

## Shutting Down Phestus

When the application is shutting down, call `shutdown()` to allow Phestus and its registered components to clean up their resources.

```ts
await phestus.shutdown()
```

This allows modules and providers to close connections, stop consumers, remove subscriptions, and perform other cleanup tasks.

A simple application lifecycle may therefore look like:

```ts
const phestus = new Phestus(config)

await phestus.initialize()

// Application is running...

await phestus.shutdown()
```

## Application Integration

In a long-running application, Phestus can be initialized when the application starts and shut down when the application receives a termination signal.

```ts
const phestus = new Phestus(config)

await phestus.initialize()

process.on('SIGTERM', async () => {
    await phestus.shutdown()
    process.exit(0)
})
```

Phestus manages the lifecycle of its own modules, providers, and plugins while the application remains responsible for determining when the runtime should start and stop.
