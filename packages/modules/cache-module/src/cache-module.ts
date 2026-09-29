import { PhestusModule } from "@phestus/sdk";
import { CacheProvider, CacheSetOptions } from "./types";


export class CacheModule implements PhestusModule {
    manifest = {
        slug: "cache",
        name: "Cache Module",
        version: "0.1.0",
    };

    constructor(private provider: CacheProvider) {}

    get<T = unknown>(key: string) {
        return this.provider.get<T>(key);
    }

    set<T = unknown>(key: string, value: T, options?: CacheSetOptions) {
        return this.provider.set(key, value, options);
    }

    delete(key: string) {
        return this.provider.delete(key);
    }

    has(key: string) {
        return this.provider.has(key);
    }

    clear() {
        return this.provider.clear();
    }
}