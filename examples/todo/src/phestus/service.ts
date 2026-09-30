import { PhestusService } from '@phestus/sdk'

export const service: PhestusService = {
    schema: {
        async get(collection) {
            return null
        },

        async exists(collection) {
            return false
        },

        async create(collection, schema) { },
        async update(collection, schema) { },
        async ensure(collection, schema) { },
    },

    data: {
        async find(collection, query) {
            return {
                docs: [],
                totalDocs: 0,
                limit: query?.limit ?? 10,
                offset: query?.offset ?? 0,
                hasNextPage: false,
                hasPrevPage: false,
            }
        },

        async findById(collection, id) {
            return null
        },

        async count(collection, query) {
            return 0
        },

        async create<T = unknown>(collection: string, data: unknown): Promise<T> {
            return data as T
        },

        async update<T = unknown>(
            collection: string,
            id: string,
            data: unknown
        ): Promise<T> {
            return data as T
        },

        async delete<T = unknown>(
            collection: string,
            id: string
        ): Promise<T> {
            return null as T
        },
    },
}