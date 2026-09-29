import { PhestusProvider } from "@phestus/sdk";

export type CronTask<T = unknown> = {
    name: string;
    cron: string;
    job: string;
    payload?: T;
};

export interface CronProvider extends PhestusProvider {
    schedule(task: CronTask, handler: () => Promise<void>): Promise<void>;
    remove(task: CronTask): Promise<void>;
}