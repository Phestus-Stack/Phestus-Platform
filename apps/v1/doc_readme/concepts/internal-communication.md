---
title: Internal Communication
description: This is a doc describing how communication works inside of the Phestus platform.
tags:
 - phestus
 - communication
 - modules
 - providers
 - web stack
 - web framework
 - modular
order: 1
---

## Event Driven Communication

Phestus supports first-class event-driven communication through the **Event**, **Queue**, and **Job** modules.

Events provide a way for one part of an application to communicate that something has happened without needing to know which components will handle it. This keeps modules decoupled and allows work to be processed asynchronously.

A Phestus event follows a simple structure:

```ts
export interface PhestusEvent<TData = unknown> {
    id: string
    type: string
    source: string
    data: TData
    timestamp: Date
}
```

For example, a payment module could create an event after a payment has been completed:

```ts
const paymentEvent: PhestusEvent = {
    id: 'payment-completed',
    type: 'payment.completed',
    source: 'payment-module',
    data: {
        paymentId: 'payment_123',
        amount: 100,
    },
    timestamp: new Date(),
}
```

The event can then be emitted through the Event module:

```ts
const phestus = getPhestus()
const event = phestus.getModule<EventModule>('event')

await event.emit(paymentEvent)
```

The Event module is responsible for handling the event and passing it through the configured communication infrastructure. Depending on the configured providers and modules, this may involve publishing the event to a queue for asynchronous processing.

This means the module producing an event does not need to know which consumers will eventually process it.

For example:

```text
Payment Module
      |
      v
 Event Module
      |
      v
 Queue Module
      |
      v
 Job / Consumer
      |
      +------> Email
      |
      +------> Analytics
      |
      +------> Notifications
```

This approach is useful when multiple parts of an application need to react to the same action or when work should happen outside of the current request.

## Direct Module Calls

Not every interaction needs to be represented as an event.

Phestus also allows modules to communicate directly with one another through the Phestus runtime. A module can retrieve another registered module and invoke its exposed capabilities.

For example:

```ts
const phestus = getPhestus()
const event = phestus.getModule<EventModule>('event')

await event.emit(paymentEvent)
```

Direct module communication is useful when one module explicitly needs another module to perform an operation.

For example, a workflow module may directly interact with the Job module when it needs to create or manage a job:

```ts
const phestus = getPhestus()
const job = phestus.getModule<JobModule>('job')

await job.create({
    type: 'send-email',
    data: {
        to: 'user@example.com',
    },
})
```

The important distinction is that a direct module call represents an explicit dependency, while an event represents something that has happened and may be handled by one or more consumers.

## Choosing Between Events and Direct Calls

Both communication patterns have a place within a Phestus application.

Use **events** when:
* Multiple components may need to react to an action.
* The producer should not need to know about its consumers.
* Work can happen asynchronously.
* The operation should be processed through a queue or job.
* You want to reduce coupling between modules.

Use **direct module calls** when:
* One module explicitly requires another module.
* The operation is part of the current execution flow.
* You need a direct response from another module.
* The relationship between the two modules is intentional and known.

For example, completing a payment could emit a `payment.completed` event:

```ts
await event.emit({
    id: 'payment-completed',
    type: 'payment.completed',
    source: 'payment-module',
    data: payment,
    timestamp: new Date(),
})
```

The payment module does not need to know whether that event is eventually used for email notifications, analytics, inventory updates, or something else.

On the other hand, if a module needs to directly create a job, it can use the Job module itself:

```ts
const job = phestus.getModule<JobModule>('job')

await job.create({
    type: 'send-email',
    data: {
        to: 'user@example.com',
    },
})
```

This makes the dependency explicit.

## Modules, Providers, and Communication

Phestus separates communication capabilities from their underlying implementations.

Modules define the capabilities that the application uses, while providers implement those capabilities.

For example, an application can use the Event and Queue modules without needing to know whether events are being transported through Redis, another message broker, or a different implementation.

Conceptually:

```text
Application
     |
     v
Event Module
     |
     v
Queue Module
     |
     v
Queue Provider
     |
     v
Infrastructure
```

This allows the communication layer to remain consistent even when the underlying infrastructure changes.

A module should generally depend on another module's **capability**, rather than depending directly on a specific provider.

This is one of the core ideas behind the modular architecture of Phestus.

## Communication and Decoupling

The communication system is designed to allow Phestus applications to grow without forcing every module to know about every other module.

A module can expose capabilities through its public API, communicate directly with another module when an explicit dependency exists, or publish events when other parts of the system should be able to react independently.

This creates a distinction between:

```text
Direct Communication
Module A ───────────> Module B
```

and:

```text
Event Communication
Module A ──> Event ──> Consumers
```

The first establishes a direct relationship between modules. The second allows modules to communicate without requiring a direct relationship between the producer and every consumer.

## Conclusion

Communication in Phestus is built around keeping application components modular and loosely coupled.

**Direct module calls** provide an explicit way for modules to use the capabilities of other modules, while **events** provide a decoupled mechanism for communicating that something has happened.

The Event, Queue, and Job modules can work together to move work out of the immediate execution flow and into asynchronous processing, while providers supply the infrastructure used to implement those capabilities.

### Together, these communication patterns allow Phestus applications to remain modular while still supporting complex workflows, background processing, and communication between different parts of an application.
