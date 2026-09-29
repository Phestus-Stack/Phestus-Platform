import type {
    PhestusContext,
    PhestusModule,
} from "@phestus/sdk";

import { QueueModule } from "@phestus/queue-module";

import type {
    Job,
    JobHandler,
    JobOptions,
    RegisteredJob,
} from "./types";

export class JobModule implements PhestusModule {
    manifest = {
        slug: "job",
        name: "Job Module",
        version: "0.1.0",
        dependencies: [
            {
                type: "module" as const,
                slug: "queue",
                version: "0.1.0",
                optional: false,
            },
        ],
    };

    private readonly jobs = new Map<string, RegisteredJob>();

    private readonly consumers = new Map<string, () => Promise<void>>();

    private context?: PhestusContext;
    private initialized = false;

    constructor(
        private readonly queue: QueueModule,
    ) { }

    // --------------------------------------------------
    // Lifecycle
    // --------------------------------------------------

    async initialize(
        context: PhestusContext,
    ): Promise<void> {

        this.context = context;
        this.initialized = true;

        const queues = new Set(
            [...this.jobs.values()].map(
                job => job.queue,
            ),
        );

        for (const queue of queues) {
            await this.startConsumer(queue);
        }

        context.logger.info(
            "Job Module initialized",
        );
    }

    async shutdown(
        context: PhestusContext,
    ): Promise<void> {

        await Promise.all(
            [...this.consumers.values()].map(
                unsubscribe => unsubscribe(),
            ),
        );

        this.consumers.clear();
        this.jobs.clear();

        this.initialized = false;
        this.context = undefined;

        context.logger.info(
            "Job Module shutdown",
        );
    }

    // --------------------------------------------------
    // Registration
    // --------------------------------------------------

    register<T>(
        name: string,
        handler: JobHandler<T>,
        options: JobOptions,
    ): void {

        if (this.jobs.has(name)) {
            throw new Error(
                `Job handler already registered: ${name}`,
            );
        }

        if (!options.queue) {
            throw new Error(
                `Queue is required for job: ${name}`,
            );
        }

        this.jobs.set(
            name,
            {
                queue: options.queue,
                handler: handler as JobHandler,
            },
        );

        if (this.initialized) {
            void this.startConsumer(
                options.queue,
            );
        }
    }

    // --------------------------------------------------
    // Dispatch
    // --------------------------------------------------

    async dispatch<T>(
        job: Job<T>,
    ): Promise<void> {

        const registered =
            this.jobs.get(job.name);

        if (!registered) {
            throw new Error(
                `No handler registered for job: ${job.name}`,
            );
        }

        await this.queue.enqueue(
            this.getQueueName(
                registered.queue,
            ),
            job,
        );
    }

    // --------------------------------------------------
    // Consumers
    // --------------------------------------------------

    private async startConsumer(
        queue: string,
    ): Promise<void> {

        if (this.consumers.has(queue)) {
            return;
        }

        if (!this.context) {
            throw new Error(
                "Job Module has not been initialized",
            );
        }

        const unsubscribe =
            await this.queue.consume<Job>(
                this.getQueueName(queue),

                async message => {
                    const job =
                        message.payload;

                    const registered =
                        this.jobs.get(job.name);

                    if (!registered) {
                        throw new Error(
                            `No handler registered for job: ${job.name}`,
                        );
                    }

                    await registered.handler(
                        {
                            ...job,
                            id: message.id,
                        },
                        this.context!,
                    );
                },

                {
                    consumer: `job:${queue}`,
                },
            );

        this.consumers.set(
            queue,
            unsubscribe,
        );
    }

    // --------------------------------------------------
    // Queue Naming
    // --------------------------------------------------

    private getQueueName(
        queue: string,
    ): string {
        return `phestus:jobs:${queue}`;
    }
}