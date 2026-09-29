---
title: Introduction to Cron
description: Learn how scheduled tasks work in Phestus and how the Cron module connects scheduled execution to jobs.
tags:
 - phestus
 - cron
 - jobs
 - scheduling
order: 1
---

# Cron

The **Cron module** provides scheduled task execution in Phestus.

Cron allows an application to execute a job according to a cron expression rather than requiring another part of the application to explicitly dispatch the job.

For example, an application may need to:

* Send a daily report.
* Clean up expired data every hour.
* Process recurring payments.
* Refresh cached data.
* Run a maintenance task once per day.
* Execute a job every few minutes.

Rather than putting this scheduling logic directly into an application or job implementation, Phestus provides the Cron module as a layer between scheduling and job execution.

## How Cron Works

The Cron module uses a **Cron provider** to handle the actual scheduling mechanism.

The module itself does not need to know how cron expressions are interpreted or how timers are maintained.

Instead, the architecture is:

```text
Cron Task
    │
    ▼
Cron Module
    │
    ▼
Cron Provider
    │
    ▼
Scheduled Execution
    │
    ▼
Job Module
    │
    ▼
Job
```

A cron task contains the information required to schedule a job:

```ts
export type CronTask<T = unknown> = {
    name: string;
    cron: string;
    job: string;
    payload?: T;
};
```

The `name` uniquely identifies the scheduled task.

The `cron` property contains the cron expression used by the provider.

The `job` property identifies the Phestus job that should be dispatched when the schedule runs.

An optional `payload` can be supplied to the job.

For example:

```ts
{
    name: "daily-report",
    cron: "0 0 * * *",
    job: "generate-daily-report",
}
```

When the schedule triggers, the Cron module dispatches the corresponding job through the Job module.

## Cron and Jobs

Cron is intentionally connected to the Job module rather than executing application logic directly.

This keeps scheduling separate from the work being performed.

For example, a scheduled task might look like:

```ts
{
    name: "cleanup-expired-sessions",
    cron: "0 * * * *",
    job: "cleanup-sessions",
}
```

The Cron module does not perform the cleanup itself.

Instead, it dispatches:

```ts
this.job.dispatch({
    name: "cleanup-sessions",
});
```

The Job module then handles the job using its configured queue and job infrastructure.

This means scheduled work can use the same job infrastructure as work dispatched by events, workflows, APIs, or other application code.

## Providers

The Cron module defines the scheduling interface but does not provide the underlying scheduling implementation.

A provider implements:

```ts
export interface CronProvider extends PhestusProvider {
    schedule(
        task: CronTask,
        handler: () => Promise<void>
    ): Promise<void>;

    remove(task: CronTask): Promise<void>;
}
```

This allows different scheduling technologies to be used without changing the Cron module.

For example, a provider could use:

* Node.js timers
* A cron library
* Redis-backed scheduling
* A cloud scheduling service
* Another external scheduling system

The Cron module remains the same regardless of which provider is installed.

## Module Architecture

The Cron module depends on the Job module:

```ts
dependencies: [
    {
        type: "module",
        slug: "job",
        version: "0.1.0",
    },
],
```

This dependency allows Cron to dispatch registered jobs when schedules execute.

The provider remains separate from the module so that scheduling infrastructure can be replaced without changing application code.

## Next Steps

The following articles demonstrate how to build and use Cron.
