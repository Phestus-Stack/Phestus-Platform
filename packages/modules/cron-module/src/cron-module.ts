import type {
    PhestusModule,
} from "@phestus/sdk";
import type { CronProvider, CronTask } from "./types";
import type { JobModule } from '@phestus/job-module';


export class CronModule implements PhestusModule {
    manifest = {
        slug: "cron",
        name: "Cron Module",
        version: "0.1.0",
        dependencies: [
            {
                type: 'module' as const,
                slug: 'job',
                version: '0.1.0',
            },
        ],
    };

    private tasks = new Map<string, CronTask>();

    constructor(
        private readonly job: JobModule,
        private readonly provider: CronProvider,
    ) { }

    async schedule(cronTask: CronTask) {
        if (this.tasks.has(cronTask.name)) {
            throw new Error(`Cron task "${cronTask.name}" is already registered`);
        }

        this.tasks.set(cronTask.name, cronTask);

        await this.provider.schedule(
            cronTask,
            () => this.job.dispatch({
                name: cronTask.job,
                payload: cronTask.payload
            })
        );
    }

    get(name: string) {
        return this.tasks.get(name);
    }

    list() {
        return Array.from(this.tasks.values());
    }

    async remove(name: string) {
        const task = this.tasks.get(name);

        if (!task) {
            return;
        }

        await this.provider.remove(task);

        this.tasks.delete(name);
    }
}