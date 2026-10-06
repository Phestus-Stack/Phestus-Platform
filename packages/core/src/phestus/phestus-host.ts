import {
    EventBus,
    Logger,
    PhestusContext,
    PhestusModule,
    PhestusPlugin,
    PhestusService,
} from "@phestus/sdk";
import { PluginRegistry } from "../registry/plugin-registry";
import { ProviderRegistry } from "../registry/provider-registry";
import { ModuleRegistry } from "../registry/module-registry";
import { PhestusRuntime } from "../runtime";

export interface PhestusHostConfig {
    plugins?: PhestusPlugin[];
    modules?: PhestusModule[];
    service?: PhestusService;
    logger: Logger;
    eventBus?: EventBus;
}

export class PhestusHost {
    protected readonly plugins: PluginRegistry;
    protected readonly providers: ProviderRegistry;
    protected readonly modules: ModuleRegistry;
    protected readonly runtime: PhestusRuntime;

    protected readonly service?: PhestusService

    private initialization?: Promise<void>;

    constructor(config: PhestusHostConfig) {
        this.modules = new ModuleRegistry();

        this.providers = new ProviderRegistry(
            this.modules,
        );

        this.plugins = new PluginRegistry(
            this.modules,
        );

        this.service = config.service;

        const context: PhestusContext = {
            service: config.service,
            logger: config.logger,
            eventBus: config.eventBus,
        };

        for (const module of config.modules ?? []) {
            this.modules.register(module);
        }

        for (const plugin of config.plugins ?? []) {
            this.plugins.register(plugin);

            for (const module of plugin.modules ?? []) {
                this.modules.register(module);
            }

            for (const provider of plugin.providers ?? []) {
                this.providers.register(provider);
            }
        }

        this.runtime = new PhestusRuntime(
            context,
            this.modules,
            this.providers,
            this.plugins,
        );
    }

    async initialize() {
        if (!this.initialization) {
            this.initialization = this.runtime.initialize();
        }

        await this.initialization;
    }

    async shutdown() {
        await this.runtime.shutdown();
    }

    getState() {
        return this.runtime.getState();
    }

    async ready() {
        if (this.getState() === 'initialized') {
            return;
        }

        if (this.initialization) {
            await this.initialization;
            return;
        }

        throw new Error('Phestus has not been initialized');
    }

    getModule<T extends PhestusModule>(slug: string): T {
        return this.modules.get(slug) as T;
    }

    getProvider(slug: string) {
        return this.providers.get(slug);
    }

    getPlugin(slug: string) {
        return this.plugins.get(slug);
    }

    getService() {
        if (!this.service) {
            throw new Error('Phestus service is not configured')
        }

        return this.service
    }
}