---
title: Introduction
order: 1
description: An introduction into plugins and how they work inside of the phestus ecosystem.
tags:
  - phestus
  - plugins
  - introduction
  - web stack
  - web framework
  - modular
---

# Introduction

Plugins are the primary way Phestus packages related modules and providers into a single installable unit.

A plugin can contain:

* One or more modules
* One or more providers
* Dependencies on other plugins, modules, or providers
* A manifest describing the plugin
* Lifecycle hooks for initialization and shutdown
* Capability declarations connecting providers to the modules they implement

This allows a plugin to represent a complete piece of functionality without requiring developers to manually assemble every part of it.

## Why Plugins Exist

Phestus separates **capabilities** from their **implementations**.

A module defines what a system can do, while a provider implements that capability.

For example, an event module may define the event system while a Redis provider implements that system using Redis.

A plugin can package those pieces together:

```text
Plugin
├── Module
└── Provider
```

This means a developer can install a plugin that provides a complete implementation without needing to manually register each provider and module.

## Plugins as Composition Units

A plugin is not itself a module or provider.

Instead, it is a composition layer around them.

For example:

```ts
const plugin: PhestusPlugin = {
    manifest: {
        slug: "redis-events",
        name: "Redis Events",
        version: "0.1.0",
        provides: [
            {
                moduleSlug: "event",
                providerSlug: "redis",
            },
        ],
    },

    providers: [
        redisProvider,
    ],
};
```

The plugin declares that the `redis` provider implements the `event` module.

The module itself may already be installed separately:

```ts
const phestus = new Phestus({
    modules: [
        eventModule,
    ],

    plugins: [
        redisEventsPlugin,
    ],

    service,
    logger,
    eventBus,
});
```

The plugin therefore does not need to own every component it uses. It can provide an implementation for an existing module or package a module and its provider together.

## What a Plugin Contains

The `PhestusPlugin` interface contains four primary areas:

```ts
interface PhestusPlugin {
    manifest: PluginManifest;

    modules?: PhestusModule[];
    providers?: PhestusProvider[];

    initialize?(context: PhestusContext): Promise<void>;
    shutdown?(context: PhestusContext): Promise<void>;
}
```

### Manifest

Every plugin must define a manifest.

The manifest identifies the plugin and describes its dependencies and capabilities.

```ts
interface PluginManifest {
    slug: string;
    name: string;
    version: string;

    provides: PluginCapability[];

    dependencies?: PhestusDependency[];
}
```

### Modules

Plugins can provide modules.

```ts
modules?: PhestusModule[];
```

This is useful when a plugin introduces an entirely new capability and therefore needs to ship both the module definition and its provider.

### Providers

Plugins can provide providers.

```ts
providers?: PhestusProvider[];
```

This is the most common way for a plugin to connect an implementation to an existing module.

### Lifecycle Hooks

Plugins may also participate in the Phestus lifecycle:

```ts
initialize?(context: PhestusContext): Promise<void>;

shutdown?(context: PhestusContext): Promise<void>;
```

Use these hooks when the plugin itself needs to perform startup or shutdown work.

## Registering Plugins

Plugins are registered through the main `Phestus` configuration:

```ts
const phestus = new Phestus({
    plugins: [
        myPlugin,
    ],

    service,
    logger,
    eventBus,
});
```

Phestus registers the plugin, then registers any modules and providers supplied by that plugin.

After registration, the plugin and its components are available through the runtime:

```ts
phestus.getPlugin("my-plugin");
phestus.getModule<MyModule>("my-module");
phestus.getProvider("my-provider");
```

Plugins can therefore act as the installation boundary while modules and providers remain independently accessible through Phestus.

## When to Create a Plugin

A plugin is useful when functionality needs to be distributed as a reusable package.

Typical examples include:

* Database providers
* Queue providers
* Event providers
* Authentication providers
* Payment integrations
* External API integrations
* Complete feature packages containing new modules and providers

If the functionality is only a capability definition, it generally belongs in a module.

If the functionality implements an existing capability, it generally belongs in a provider.

If those pieces need to be distributed together, they belong in a plugin.

## The Plugin Model

The overall relationship can be thought of as:

```text
Plugin
   │
   ├── Modules
   │     └── Define capabilities
   │
   ├── Providers
   │     └── Implement capabilities
   │
   ├── Dependencies
   │     └── Define required components
   │
   └── Lifecycle
         ├── initialize()
         └── shutdown()
```

Plugins provide the composition layer that brings these pieces together into a reusable unit.
