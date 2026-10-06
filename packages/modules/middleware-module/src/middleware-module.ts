import type {
    PhestusModule,
} from "@phestus/sdk";

import type {
    Middleware,
    MiddlewareRegistry,
    MiddlewareNext,
    MiddlewareRequest,
    MiddlewareResponse,
    MiddlewareOptions,
} from "./types";

export class MiddlewareModule implements PhestusModule, MiddlewareRegistry {
    manifest = {
        slug: "middleware",
        name: "Middleware Module",
        version: "0.1.0",
    };

    private middleware: Middleware[] = [];

    use(middleware: Middleware): void {
        this.middleware.push(middleware);
    }

    getMiddleware(): Middleware[] {
        return [...this.middleware];
    }

    async execute(
        request: MiddlewareRequest,
        handler: MiddlewareNext,
        middleware?: MiddlewareOptions[],
    ): Promise<MiddlewareResponse> {
        const middlewareList = middleware ?? [];

        let index = -1;

        const dispatch = async (position: number): Promise<MiddlewareResponse> => {
            if (position <= index) {
                throw new Error('Middleware called next() multiple times');
            }

            index = position;

            const config = middlewareList[position];

            if (!config) {
                return handler();
            }

            const middleware = this.getMiddleware().find(
                item => item.name === config.name,
            );

            if (!middleware) {
                throw new Error(`Middleware '${config.name}' is not registered`);
            }

            return middleware.handle(
                request,
                () => dispatch(position + 1),
                config.options,
            );
        };

        return dispatch(0);
    }
}