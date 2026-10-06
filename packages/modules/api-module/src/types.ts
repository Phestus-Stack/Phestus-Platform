export type ApiMethod =
    | "GET"
    | "POST"
    | "PUT"
    | "PATCH"
    | "DELETE";

export interface ApiRequest<
    TBody = unknown,
    TParams = Record<string, string>,
    TQuery = Record<string, string>,
> {
    body: TBody;
    params: TParams;
    query: TQuery;
    headers: Record<string, string>;
    context: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
    status: number;
    data: T;
}

export interface ApiMiddleware {
    name: string;
    options?: Record<string, unknown>;
}

export interface ApiEndpoint<
    TBody = unknown,
    TParams = Record<string, string>,
    TQuery = Record<string, string>,
    TResponse = unknown,
> {
    method: ApiMethod;
    path: string;

    middleware?: ApiMiddleware[];

    handler(
        request: ApiRequest<TBody, TParams, TQuery>,
    ): Promise<ApiResponse<TResponse>>;
}

export interface ApiProvider {
    expose(endpoints: ApiEndpoint<any, any, any, any>[]): Promise<void> | void;
}

export interface Api {
    registerEndpoint<
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
    ): Promise<void>;

    getEndpoint(
        method: ApiMethod,
        path: string,
    ): ApiEndpoint | undefined;

    getEndpoints(): ApiEndpoint[];
}