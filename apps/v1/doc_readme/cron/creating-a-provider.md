---
title: Creating a Cron Provider
description: Learn how to implement a Cron provider and connect it to the Phestus Cron module.
tags:
 - phestus
 - cron
 - providers
 - modules
 - jobs
order: 2
---

# Creating a Cron Provider

The Cron module defines the scheduling API, while a **Cron provider** implements the actual scheduling mechanism.

This separation allows Phestus applications to use different scheduling technologies without changing the Cron module itself.

## The Cron Provider Interface

A Cron provider implements `CronProvider`:

```ts
import { PhestusProvider } from "@phestus/sdk";

export type CronTask<T = unknown> = {
    name: string;
    cron: string;
    job: string;
    payload?: T;
};

export interface CronProvider extends PhestusProvider {
    schedule(
        task: CronTask,
        handler: () => Promise<void>
    ): Promise<void>;

    remove(task: CronTask): Promise<void>;
}
```

The provider has two responsibilities:

* Schedule a task.
* Remove a previously scheduled task.

The provider receives the `CronTask` and a handler to execute when the schedule triggers.

The provider does not need to know anything about the Job module.

That responsibility belongs to `CronModule`.

## Implementing a Provider

As an example, a provider can use an existing cron library to perform the scheduling.

The implementation will depend on the scheduling library being used. Conceptually, the provider needs to keep track of scheduled tasks so that they can later be removed.

For example:

```ts
import type {
    CronProvider,
    CronTask,
} from "@phestus/cron-module";

export class NodeCronProvider implements CronProvider {
    slug = "node-cron";
    name = "Node Cron Provider";
    version = "0.1.0";

    private tasks = new Map<string, unknown>();

    async schedule(
        task: CronTask,
        handler: () => Promise<void>
    ) {
        const scheduled = /* create scheduled task */;

        this.tasks.set(task.name, scheduled);
    }

    async remove(task: CronTask) {
        const scheduled = this.tasks.get(task.name);

        if (!scheduled) {
            return;
        }

        /* stop scheduled task */

        this.tasks.delete(task.name);
    }
}
```

The exact implementation of `schedule` and `remove` depends on the scheduling technology used by the provider.

The important part is that the provider implements the Phestus interface.

## Why the Handler Is Passed to the Provider

The provider receives this function:

```ts
handler: () => Promise<void>
```

The provider is responsible for deciding **when** the function runs.

It does not decide **what the function does**.

For example, the Cron module passes a handler that dispatches the corresponding job:

```ts
await this.provider.schedule(
    cronTask,
    () => this.job.dispatch({
        name: cronTask.job,
        payload: cronTask.payload,
    })
);
```

This gives the provider a simple responsibility:

```text
Cron Provider
    │
    │ decides when
    ▼
handler()
    │
    │ dispatches
    ▼
Job Module
```

The provider therefore remains independent from Phestus jobs.

## Creating the Cron Module

The Cron module receives both the Job module and Cron provider through its constructor:

```ts
export class CronModule implements PhestusModule {
    manifest = {
        slug: "cron",
        name: "Cron Module",
        version: "0.1.0",
        dependencies: [
            {
                type: "module" as const,
                slug: "job",
                version: "0.1.0",
            },
        ],
    };

    private tasks = new Map<string, CronTask>();

    constructor(
        private readonly job: JobModule,
        private readonly provider: CronProvider,
    ) {}
}
```

The Job module is used to dispatch work.

The provider is used to schedule that work.

## Scheduling a Task

The module's `schedule` method first prevents duplicate task names:

```ts
if (this.tasks.has(cronTask.name)) {
    throw new Error(
        `Cron task "${cronTask.name}" is already registered`
    );
}
```

The task is then stored by the module:

```ts
this.tasks.set(cronTask.name, cronTask);
```

Finally, the provider is given the task and a handler:

```ts
await this.provider.schedule(
    cronTask,
    () => this.job.dispatch({
        name: cronTask.job,
        payload: cronTask.payload,
    })
);
```

This is the key connection between Cron and Jobs.

A scheduled execution becomes a normal job dispatch.

## Removing Tasks

The module can also remove scheduled tasks:

```ts
async remove(name: string) {
    const task = this.tasks.get(name);

    if (!task) {
        return;
    }

    await this.provider.remove(task);

    this.tasks.delete(name);
}
```

The module first retrieves the task and passes it to the provider.

Once the provider removes the schedule, the module removes its local registration.

## Provider Responsibilities

A Cron provider should generally be responsible for:

* Interpreting cron expressions.
* Creating schedules.
* Tracking provider-specific schedule handles.
* Executing the supplied handler.
* Removing schedules.

The provider should not be responsible for:

* Registering Phestus jobs.
* Knowing about queues.
* Managing workflows.
* Implementing application business logic.

Those responsibilities belong to other Phestus modules.

## Provider Plugins

A provider can be distributed as part of a Phestus plugin.

For example:

```text
@phestus/cron-module
@phestus/node-cron-provider
```

The module provides the common Cron API while the provider supplies the implementation.

This means an application can replace its scheduling infrastructure without changing code that uses:

```ts
cron.schedule(...)
```

The application depends on the module's interface rather than the provider's implementation.

## Next Steps

Once a provider has been implemented, the Cron module can be registered with Phestus and used to schedule jobs.

## The next article demonstrates this process.
