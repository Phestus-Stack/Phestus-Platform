import type {
    PhestusModule,
} from "@phestus/sdk";

import type {
    Api,
    ApiEndpoint,
    ApiMethod,
    ApiProvider,
} from "./types";

export class ApiModule implements PhestusModule, Api {
    manifest = {
        slug: "api",
        name: "Api Module",
        version: "0.1.0",
        dependencies: [
            {
                type: "module" as const,
                slug: "auth",
                version: "0.1.0",
                optional: false,
            },
            {
                type: "module" as const,
                slug: "middleware",
                version: "0.1.0",
                optional: false,
            },
        ],
    };

    private endpoints = new Map<
        string,
        ApiEndpoint<any, any, any, any>
    >();
    private initialized = false;

    constructor(
        private provider: ApiProvider,
    ) { }

    async initialize(): Promise<void> {
        await this.provider.expose(this.getEndpoints());
        this.initialized = true;
    }

    async registerEndpoint<
        TBody = unknown,
        TParams = Record<string, string>,
        TQuery = Record<string, string>,
        TResponse = unknown,
    >(
        endpoint: ApiEndpoint<
            TBody,
            TParams,
            TQuery,
            TResponse
        >,
    ): Promise<void> {
        const key = `${endpoint.method}:${endpoint.path}`;

        if (this.endpoints.has(key)) {
            throw new Error(`Endpoint already registered: ${key}`);
        }

        this.endpoints.set(key, endpoint);

        if (this.initialized) {
            await this.provider.expose([endpoint]);
        }
    }

    getEndpoint(
        method: ApiMethod,
        path: string,
    ): ApiEndpoint<any, any, any, any> | undefined {
        return this.endpoints.get(`${method}:${path}`);
    }

    getEndpoints(): ApiEndpoint<any, any, any, any>[] {
        return Array.from(this.endpoints.values());
    }
}