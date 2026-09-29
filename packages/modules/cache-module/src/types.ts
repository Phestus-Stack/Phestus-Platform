import { PhestusProvider } from "@phestus/sdk";

export interface CacheProvider extends PhestusProvider {
    get<T = unknown>(key: string): Promise<T | null>;
    set<T = unknown>(key: string, value: T, options?: CacheSetOptions): Promise<void>;
    delete(key: string): Promise<void>;
    has(key: string): Promise<boolean>;
    clear(): Promise<void>;
}

export interface CacheSetOptions {
    ttl?: number;
}