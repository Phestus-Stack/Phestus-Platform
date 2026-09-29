---
title: Using Cron
description: Learn how to register the Cron module, schedule jobs, inspect scheduled tasks, and remove schedules in Phestus.
tags:
 - phestus
 - cron
 - jobs
 - scheduling
order: 3
---

# Using Cron

Once a Cron provider is available, the Cron module can be used to schedule Phestus jobs.

Cron is designed to work alongside the Job module, meaning scheduled work is dispatched through the same job system used by the rest of the application.

## Registering Cron

The Cron module requires two things:

* A `JobModule`.
* A `CronProvider`.

For example:

```ts
const cron = new CronModule(
    job,
    cronProvider
);
```

The module can then be registered with Phestus alongside the Job module and its other dependencies.

```ts
const phestus = new Phestus({
    modules: [
        job,
        cron,
    ],
});
```

The exact provider registration depends on the provider being used.

## Creating a Scheduled Job

Before scheduling a task, register the job that should be executed.

For example:

```ts
job.register(
    "generate-daily-report",
    async (payload) => {
        console.log("Generating daily report");
    },
    {
        queue: "comms",
    }
);
```

The Cron task can then reference that job by name:

```ts
await cron.schedule({
    name: "daily-report",
    cron: "0 0 * * *",
    job: "generate-daily-report",
});
```

The Cron module does not execute the report logic directly.

When the schedule triggers, it dispatches:

```ts
job.dispatch({
    name: "generate-daily-report",
});
```

The Job module then handles the job through its configured queue.

## Passing a Payload

Cron tasks can also provide a payload to their job.

For example:

```ts
await cron.schedule({
    name: "generate-report",
    cron: "0 0 * * *",
    job: "generate-report",
    payload: {
        type: "daily",
        format: "pdf",
    },
});
```

When the schedule executes, the Cron module dispatches:

```ts
this.job.dispatch({
    name: cronTask.job,
    payload: cronTask.payload,
});
```

The registered job receives the payload:

```ts
job.register(
    "generate-report",
    async (payload) => {
        console.log(payload);
    },
    {
        queue: "comms",
    }
);
```

This allows the same job to be reused by multiple schedules with different data.

## Cron Expressions

The `cron` property contains the expression understood by the installed provider.

For example:

```ts
{
    name: "hourly-cleanup",
    cron: "0 * * * *",
    job: "cleanup",
}
```

Or:

```ts
{
    name: "daily-maintenance",
    cron: "0 0 * * *",
    job: "maintenance",
}
```

The Cron module does not interpret the expression itself.

The provider is responsible for interpreting and scheduling the expression.

This allows providers to use different scheduling implementations while maintaining the same module API.

## Multiple Scheduled Tasks

An application can register multiple independent tasks.

```ts
await cron.schedule({
    name: "hourly-cleanup",
    cron: "0 * * * *",
    job: "cleanup",
});

await cron.schedule({
    name: "daily-report",
    cron: "0 0 * * *",
    job: "generate-daily-report",
});

await cron.schedule({
    name: "weekly-maintenance",
    cron: "0 0 * * 0",
    job: "weekly-maintenance",
});
```

Each task has its own name, schedule, and job.

The Cron module keeps track of these tasks independently.

## Task Names

Task names must be unique within a Cron module.

For example, registering:

```ts
await cron.schedule({
    name: "daily-report",
    cron: "0 0 * * *",
    job: "generate-report",
});
```

and then attempting to register another task with the same name:

```ts
await cron.schedule({
    name: "daily-report",
    cron: "0 12 * * *",
    job: "generate-report",
});
```

will result in an error:

```text
Cron task "daily-report" is already registered
```

This prevents one scheduled task from unintentionally replacing another.

## Retrieving a Task

A specific task can be retrieved by name:

```ts
const task = cron.get("daily-report");
```

If the task exists, the registered `CronTask` is returned.

```ts
console.log(task);
```

A task that does not exist returns `undefined`.

## Listing Tasks

All registered tasks can be retrieved with:

```ts
const tasks = cron.list();
```

This returns an array containing the tasks currently registered with the Cron module.

For example:

```ts
const tasks = cron.list();

for (const task of tasks) {
    console.log(task.name);
}
```

This can be useful for administrative interfaces or application diagnostics.

## Removing a Task

A scheduled task can be removed by its name:

```ts
await cron.remove("daily-report");
```

The Cron module retrieves the task and asks the provider to remove its schedule.

After the provider removes the schedule, the task is removed from the module's registry.

Calling `remove` for a task that does not exist does not throw an error.

## Combining Cron With Jobs

Cron becomes particularly useful when combined with queues and jobs.

For example:

```text
Cron
 │
 │ scheduled execution
 ▼
Cron Module
 │
 │ dispatch
 ▼
Job Module
 │
 │ queue
 ▼
Queue
 │
 ▼
Worker
 │
 ▼
Job Handler
```

This separates scheduling from execution.

The Cron provider determines **when** something should happen.

The Job module determines **what work should be dispatched**.

The Queue module determines **how that work is delivered for execution**.

A worker can then process the job independently from the process responsible for maintaining the schedule.

## Example

A complete example might look like:

```ts
job.register(
    "send-daily-report",
    async (payload) => {
        console.log("Sending report:", payload);
    },
    {
        queue: "comms",
    }
);

await cron.schedule({
    name: "daily-report",
    cron: "0 0 * * *",
    job: "send-daily-report",
    payload: {
        report: "daily",
    },
});
```

The resulting architecture is:

```text
             Cron Provider
                  │
                  │ schedule
                  ▼
             Cron Module
                  │
                  │ dispatch
                  ▼
              Job Module
                  │
                  │ queue
                  ▼
                Queue
                  │
                  ▼
               Worker
                  │
                  ▼
          send-daily-report
```

This keeps scheduled execution consistent with the rest of the Phestus architecture.

## Cron Is Scheduling, Not Business Logic

A useful design principle is to keep Cron tasks small.

The Cron task should identify **when** a job runs:

```ts
{
    name: "cleanup",
    cron: "0 * * * *",
    job: "cleanup-expired-data",
}
```

The job should contain the actual application behavior:

```ts
job.register(
    "cleanup-expired-data",
    async () => {
        // Application logic
    },
    {
        queue: "maintenance",
    }
);
```

This keeps scheduling concerns separate from business logic and allows the same job to be dispatched from other parts of the system.

## Summary

The Cron module provides a simple scheduling layer around Phestus jobs.

A typical application flow is:

```text
Cron Expression
      │
      ▼
Cron Provider
      │
      ▼
Cron Module
      │
      ▼
Job Module
      │
      ▼
Queue
      │
      ▼
Worker
```

### By keeping these responsibilities separate, applications can change their scheduling provider without changing the jobs or application code that depends on them.
