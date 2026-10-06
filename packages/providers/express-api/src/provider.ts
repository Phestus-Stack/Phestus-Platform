import type { Express, Request, Response } from "express";
import type {
    ApiEndpoint,
    ApiProvider,
} from "@phestus/api-module";
import type {
    MiddlewareRegistry,
} from "@phestus/middleware-module";

export class ExpressApiProvider implements ApiProvider {
    constructor(
        private app: Express,
        private middleware: MiddlewareRegistry,
    ) { }

    expose(endpoints: ApiEndpoint[]): void {
        for (const endpoint of endpoints) {
            const handler = async (
                req: Request,
                res: Response,
            ) => {
                const request = {
                    method: req.method,
                    path: req.path,
                    body: req.body,
                    params: Object.fromEntries(
                        Object.entries(req.params).map(([key, value]) => [
                            key,
                            Array.isArray(value) ? value[0] : value,
                        ]),
                    ),
                    query: req.query as Record<string, string>,
                    headers: req.headers as Record<string, string>,
                    context: {},
                };

                const response = await this.middleware.execute(
                    request,
                    () => endpoint.handler(request),
                    endpoint.middleware,
                );

                if (response.headers) {
                    for (const [key, value] of Object.entries(response.headers)) {
                        res.setHeader(key, value);
                    }
                }

                res.status(response.status).json(response.data);
            };

            switch (endpoint.method) {
                case "GET":
                    this.app.get(endpoint.path, handler);
                    break;

                case "POST":
                    this.app.post(endpoint.path, handler);
                    break;

                case "PUT":
                    this.app.put(endpoint.path, handler);
                    break;

                case "PATCH":
                    this.app.patch(endpoint.path, handler);
                    break;

                case "DELETE":
                    this.app.delete(endpoint.path, handler);
                    break;
            }
        }
    }
}