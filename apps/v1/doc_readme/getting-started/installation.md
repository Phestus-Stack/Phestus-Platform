---
title: Installation
description: A walk through of how to install Phestus and use it in your application
tags:
  - phestus
  - installation
  - web stack
  - web framework
  - modular
order: 2
--------

## Software Requirements

Phestus is a TypeScript framework built around PNPM and designed to integrate with an existing application rather than replace it.

Phestus provides abstractions for common application capabilities such as events, jobs, queues, workflows, services, and data access. These capabilities can be connected to the technologies you already use, including CMSs, databases, queues, and external services.

Phestus is designed to be extended through its **modules**, **providers**, and **plugins**, allowing you to customize the platform around the requirements of your application.

### Requirements

Before installing Phestus, make sure your project has:

* Node.js
* PNPM
* A TypeScript project

Phestus can be installed into a variety of application environments, including Next.js, Fastify, Express, and other TypeScript applications.

## Phestus Quick Start

A basic Phestus installation consists of installing the core framework packages, creating a configuration file, and providing the core services required by your application.

### 1. Install the Phestus Packages

Install the Phestus core packages using PNPM:

```bash
pnpm add @phestus/core @phestus/sdk
```

Then install the core modules your application will use:

```bash
pnpm add \
  @phestus/event-module \
  @phestus/job-module \
  @phestus/queue-module \
  @phestus/workflow-module
```

These packages provide the foundational functionality used by the Phestus runtime.

### 2. Create a Phestus Configuration

Create a `phestus.config.ts` file in your project.

This configuration is responsible for defining the services, modules, plugins, providers, logger, and event bus used by your Phestus installation.

A minimal configuration will generally contain:

* A **Phestus Service**
* A **Logger**
* An **Event Bus**
* Required **Modules**
* Required **Providers**

For example:

```ts
import type { PhestusConfig } from '@phestus/sdk'

export const phestusConfig: PhestusConfig = {
  service,
  logger,
  eventBus,

  modules: [
    // modules
  ],

  plugins: [
    // plugins
  ],
}

export const phestus = new Phestus(phestusConfig)
```

The exact configuration depends on the providers and integrations used by your application.

### 3. Configure Core Dependencies

Phestus uses abstractions for infrastructure rather than requiring a specific implementation.

Your application must provide implementations for the core services it uses.

#### Logger

The logger provides a consistent interface for application logging.

```ts
const logger = {
  debug(message, ...args) {},
  info(message, ...args) {},
  warn(message, ...args) {},
  error(message, ...args) {},
}
```

#### Service

The Phestus Service provides the abstraction between Phestus and your application's underlying data or CMS system.

This allows Phestus modules to interact with data without being tightly coupled to a specific database, CMS, or ORM.

#### Event Bus

The Event Bus provides communication between different parts of the Phestus runtime.

Modules can publish and subscribe to events without needing to know which event infrastructure is being used underneath.

#### Queue Provider

The Queue Provider supplies the underlying queue implementation used by jobs and workflows.

For example, a project may use BullMQ as its queue provider, while another implementation could use a different queue system.

## Project Structure

After installation, a typical Phestus project may look similar to:

```text
my-project/
├── src/
│   ├── phestus/
│   │   ├── logger.ts
│   │   ├── service.ts
│   │   ├── event-bus.ts
│   │   └── queue.ts
│   │
│   └── ...
│
├── phestus.config.ts
├── package.json
├── pnpm-lock.yaml
└── tsconfig.json
```

The exact structure is up to the application. Phestus does not require a specific project layout.

## Additional Notes

Phestus is designed to sit on top of your existing application rather than dictate how the application itself must be built.

Whether you are building a Next.js application, a Fastify API, a custom Node.js service, or another TypeScript application, Phestus can provide a common layer for modules, events, jobs, queues, workflows, and services.

The underlying technologies remain replaceable through Phestus's provider and service abstractions. This allows you to choose the infrastructure that best fits your application while keeping the application logic built around Phestus.

As your project grows, additional modules, providers, and plugins can be installed to extend the functionality of the runtime.
