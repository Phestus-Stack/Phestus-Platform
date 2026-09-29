---
title: Software Architecture
description: This is a doc describing how to build, scaffold, and design systems using Phestus.
tags:
 - phestus
 - architecture
 - modules
 - providers
 - web stack
 - web framework
 - modular
order: 4
---

## Introduction

Picking the framework that is right for your use case is often one of the most challenging decisions you can make at the start of a project.

One of the goals of Phestus is to make scaling your system as easy as possible. Instead of locking your application into a specific architecture, Phestus allows you to build your system around the requirements you have today and change its structure as those requirements evolve.

This is done through the Phestus **Host, Core, and Worker architecture**.

* The **Phestus Host** is the runtime responsible for registration, lifecycle management, and coordination of modules, providers, plugins, services, and adapters.
* The **Phestus Core** is the primary application runtime built on top of the Host. This is normally where the main application and its modules are executed.
* The **Phestus Worker** is a specialized implementation of the runtime designed to execute workloads independently from the main application.

Because these runtimes share the same modular architecture, a system can be organized in different ways without requiring the underlying modules to be rewritten.

In theory, this allows Phestus to be used for anything from a simple monolithic application to a distributed microservice architecture.

This document explains some of the architectures that can be built using Phestus.

## Phestus - Monolithic Design

The simplest architecture is a single Phestus Core instance.

In this model, the application, modules, providers, services, and workloads all exist within the same runtime.

```text
                    ┌─────────────────────┐
                    │     Phestus Core     │
                    │                     │
                    │  ┌───────────────┐  │
                    │  │    Modules    │  │
                    │  └───────────────┘  │
                    │                     │
                    │  ┌───────────────┐  │
                    │  │   Providers   │  │
                    │  └───────────────┘  │
                    │                     │
                    │  ┌───────────────┐  │
                    │  │    Services   │  │
                    │  └───────────────┘  │
                    └──────────┬──────────┘
                               │
                         Application
```

This is useful for smaller applications or systems where distributing workloads would provide little benefit.

For example, a web application could run its API, authentication, database access, event handling, jobs, and workflows from the same Phestus Core instance.

The important part is that the application is still modular internally.

A monolithic deployment does not mean that the application must be tightly coupled. Modules can still communicate through the interfaces provided by Phestus, while providers can abstract the underlying infrastructure.

This makes the monolithic architecture a useful starting point.

As the application grows, individual workloads can later be moved into workers without requiring the entire system to be redesigned.

## Phestus - Client/Server

A client/server architecture separates the system into a primary server and one or more client applications.

The server runs the primary Phestus Core instance and exposes functionality through an API or other communication layer.

```text
        Client Application
               │
               │ API / Network
               ▼
        ┌───────────────┐
        │  Phestus Core │
        │               │
        │    Modules    │
        │    Providers  │
        │    Services   │
        └───────┬───────┘
                │
             Storage
```

The client does not necessarily need to run a complete Phestus runtime.

A web browser, mobile application, desktop application, or another external application could communicate with a Phestus Core through its API.

In this architecture, Phestus acts primarily as the server-side application framework while the client is responsible for presentation and user interaction.

A future Phestus client runtime could theoretically provide a more integrated way for client applications to communicate with a Phestus server. However, this is not required for building a client/server system.

The existing API and communication layers can be used to create this separation.

This architecture is particularly useful when the same backend needs to support multiple clients.

For example:

```text
                 ┌──────────────┐
                 │ Web Client   │
                 └──────┬───────┘
                        │
                 ┌──────▼───────┐
                 │              │
                 │ Phestus Core │
                 │              │
                 └──────┬───────┘
                        │
             ┌──────────┼──────────┐
             │          │          │
        ┌────▼────┐ ┌───▼────┐ ┌───▼─────┐
        │ Mobile  │ │Desktop │ │ External│
        │ Client  │ │ Client │ │ Service │
        └─────────┘ └────────┘ └─────────┘
```

The important distinction is that the client and server are separate applications. Phestus does not require every application interacting with a Phestus system to be a Phestus runtime.

## Phestus - Worker Architecture

When an application begins performing expensive or long-running operations, keeping those operations inside the primary application runtime may no longer be desirable.

Phestus Workers provide a way to separate these workloads from the main Core instance.

The Core remains responsible for the primary application while Workers execute specific capabilities or workloads.

```text
                    ┌─────────────────┐
                    │   Phestus Core  │
                    │                 │
                    │ Application     │
                    │ Modules         │
                    │ API             │
                    └────────┬────────┘
                             │
                       Worker Transport
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────▼─────┐  ┌─────▼─────┐  ┌─────▼─────┐
        │  Worker   │  │  Worker   │  │  Worker   │
        │           │  │           │  │           │
        │ Compute   │  │ Jobs      │  │ Storage   │
        │           │  │           │  │           │
        └───────────┘  └───────────┘  └───────────┘
```

Each Worker can have its own Phestus Worker configuration and can load its own modules, plugins, providers, and capabilities.

This allows different machines or environments to be dedicated to different workloads.

For example, a system could have:

* A primary Core responsible for HTTP requests and application logic.
* A Worker dedicated to background jobs.
* A Worker dedicated to GPU or compute-heavy operations.
* A Worker dedicated to file or media processing.

The Core does not need to know how the workload is implemented. It only needs to communicate with a Worker capable of handling the requested capability.

This creates a separation between **application orchestration** and **workload execution**.

Workers can also be added or removed independently as the system grows.

## Phestus - Microservices

Phestus can also be used as the foundation for a distributed microservice architecture.

Instead of running one large Core instance, multiple Phestus runtimes can be responsible for different parts of the system.

```text
                         ┌──────────────┐
                         │ API Gateway  │
                         └──────┬───────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
        ┌─────▼─────┐     ┌─────▼─────┐     ┌─────▼─────┐
        │  Service  │     │  Service  │     │  Service  │
        │    Core   │     │    Core   │     │    Core   │
        │           │     │           │     │           │
        │ Accounts  │     │  Commerce │     │  Content  │
        └─────┬─────┘     └─────┬─────┘     └─────┬─────┘
              │                 │                │
              └─────────────────┼────────────────┘
                                │
                         Shared Infrastructure
```

Each service can have its own Phestus Core and only install the modules and providers required by that service.

For example, an account service might load authentication and authorization functionality while a commerce service might load order, payment, and inventory functionality.

The services can then communicate through APIs, events, queues, or other transports.

Workers can also exist alongside these services.

```text
                         Phestus Services
                    ┌─────────┬─────────┐
                    │         │         │
                    ▼         ▼         ▼
                 Core A    Core B    Core C
                    │         │         │
                    └────┬────┴────┬────┘
                         │         │
                       Workers   Workers
```

This allows the architecture to scale both horizontally and by responsibility.

However, Phestus does not require an application to use microservices simply because it supports them. A distributed architecture introduces additional infrastructure and communication requirements, so it can be introduced when the system actually benefits from that separation.

## Combining Architectures

These architectures do not have to exist independently.

A real application can combine them.

For example, a larger system might use a client/server architecture for its public applications, a Core for the primary backend, and multiple Workers for specialized workloads.

```text
                    ┌─────────────────┐
                    │     Clients     │
                    │ Web / Mobile /  │
                    │    Desktop      │
                    └────────┬────────┘
                             │
                            API
                             │
                    ┌────────▼────────┐
                    │   Phestus Core  │
                    │                 │
                    │ Application     │
                    │ API / Auth      │
                    │ Workflows       │
                    └────────┬────────┘
                             │
                    Worker Communication
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
     ┌────▼─────┐       ┌────▼─────┐       ┌────▼─────┐
     │ Worker A │       │ Worker B │       │ Worker C │
     │ Jobs     │       │ Compute  │       │ Media    │
     └──────────┘       └──────────┘       └──────────┘
```

The same modular principles apply throughout the system.

A module should define a capability, while providers can determine how that capability is implemented. Hosts provide the runtime environment in which those components operate.

This means the architecture can evolve without requiring the entire application to be rebuilt.

A project might begin as:

```text
Phestus Core
```

Then evolve into:

```text
Phestus Core
     │
     ├── Worker
     └── Worker
```

And eventually become:

```text
Core A ─── Worker
   │
Core B ─── Worker
   │
Core C ─── Worker
   │
   └────── Shared Services
```

The architecture is therefore a deployment decision rather than a fundamental restriction imposed by the framework.

## Conclusion

Phestus is designed to separate the structure of an application from the way that application is deployed.

The **Host** provides the runtime foundation.

The **Core** provides the primary application runtime.

The **Worker** provides a runtime for independently executed workloads.

Modules define capabilities, providers implement infrastructure, and plugins allow functionality to be packaged and distributed.

Together, these pieces allow a Phestus application to start simple and become more distributed as its requirements change.

A project does not need to decide its final architecture on day one.

It can begin as a single Core instance, introduce Workers when specific workloads need separation, expose APIs for external clients, or eventually split functionality into multiple Core instances.

The goal is not to prescribe one architecture.

### The goal is to provide the runtime primitives needed to build the architecture that the system requires.