import {
    PhestusService,
    PhestusSchema,
    PhestusQueryValue,
    PhestusWhere,
    PhestusQuery,
    FindResult
} from '@phestus/sdk'

type Document = {
    id: string
    [key: string]: unknown
}

const schemas = new Map<string, PhestusSchema>()
const collections = new Map<string, Map<string, Document>>()

const getValue = (
    document: Document,
    field: string,
): unknown => {
    return field.split('.').reduce<unknown>((value, key) => {
        if (
            typeof value !== 'object' ||
            value === null ||
            !(key in value)
        ) {
            return undefined
        }

        return (value as Record<string, unknown>)[key]
    }, document)
}

const compare = (
    value: unknown,
    operator: string,
    expected: PhestusQueryValue,
): boolean => {
    switch (operator) {
        case 'equals':
            return value === expected

        case 'notEquals':
            return value !== expected

        case 'contains':
            return typeof value === 'string' &&
                value.includes(String(expected))

        case 'startsWith':
            return typeof value === 'string' &&
                value.startsWith(String(expected))

        case 'endsWith':
            return typeof value === 'string' &&
                value.endsWith(String(expected))

        case 'greaterThan':
            return typeof value === 'number' &&
                typeof expected === 'number' &&
                value > expected

        case 'greaterThanOrEqual':
            return typeof value === 'number' &&
                typeof expected === 'number' &&
                value >= expected

        case 'lessThan':
            return typeof value === 'number' &&
                typeof expected === 'number' &&
                value < expected

        case 'lessThanOrEqual':
            return typeof value === 'number' &&
                typeof expected === 'number' &&
                value <= expected

        case 'in':
            return Array.isArray(expected) &&
                expected.includes(value as never)

        case 'notIn':
            return Array.isArray(expected) &&
                !expected.includes(value as never)

        case 'exists':
            return expected
                ? value !== undefined && value !== null
                : value === undefined || value === null

        default:
            return false
    }
}

const matchesWhere = (
    document: Document,
    where: PhestusWhere,
): boolean => {
    if (where.fields) {
        for (const [field, condition] of Object.entries(where.fields)) {
            const value = getValue(document, field)

            if (
                condition !== null &&
                typeof condition === 'object' &&
                !Array.isArray(condition) &&
                !(condition instanceof Date)
            ) {
                for (const [operator, expected] of Object.entries(condition)) {
                    if (!compare(value, operator, expected)) {
                        return false
                    }
                }
            } else if (value !== condition) {
                return false
            }
        }
    }

    if (where.and && !where.and.every(
        condition => matchesWhere(document, condition),
    )) {
        return false
    }

    if (where.or && !where.or.some(
        condition => matchesWhere(document, condition),
    )) {
        return false
    }

    if (where.not && matchesWhere(document, where.not)) {
        return false
    }

    return true
}

export const inMemoryService: PhestusService = {
    schema: {
        async get(collection) {
            return schemas.get(collection) ?? null
        },

        async exists(collection) {
            return schemas.has(collection)
        },

        async create(collection, schema) {
            if (schemas.has(collection)) {
                throw new Error(`Schema "${collection}" already exists`)
            }

            schemas.set(collection, schema)
            collections.set(collection, new Map())
        },

        async update(collection, schema) {
            if (!schemas.has(collection)) {
                throw new Error(`Schema "${collection}" does not exist`)
            }

            schemas.set(collection, schema)
        },

        async ensure(collection, schema) {
            if (schemas.has(collection)) {
                return
            }

            schemas.set(collection, schema)
            collections.set(collection, new Map())
        },
    },
    data: {
        async find<T = unknown>(
            collection: string,
            query?: PhestusQuery,
        ): Promise<FindResult<T>> {
            const documents = collections.get(collection)

            if (!documents) {
                throw new Error(`Collection "${collection}" does not exist`)
            }

            let docs = [...documents.values()]

            if (query?.where) {
                docs = docs.filter(document =>
                    matchesWhere(document, query.where!),
                )
            }

            const totalDocs = docs.length
            const offset = query?.offset ?? 0
            const limit = query?.limit ?? 10

            const results = docs.slice(offset, offset + limit)

            return {
                docs: results as T[],
                totalDocs,
                limit,
                offset,
                hasNextPage: offset + limit < totalDocs,
                hasPrevPage: offset > 0,
            }
        },

        async findById<T = unknown>(
            collection: string,
            id: string,
        ): Promise<T | null> {
            const document = collections.get(collection)?.get(id)

            return (document as T) ?? null
        },

        async count(
            collection: string,
            query?: PhestusQuery,
        ): Promise<number> {
            const documents = collections.get(collection)

            if (!documents) {
                throw new Error(`Collection "${collection}" does not exist`)
            }

            if (!query?.where) {
                return documents.size
            }

            return [...documents.values()]
                .filter(document =>
                    matchesWhere(document, query.where!),
                )
                .length
        },

        async create<T = unknown>(
            collection: string,
            data: Record<string, unknown>,
        ): Promise<T> {
            const documents = collections.get(collection)

            if (!documents) {
                throw new Error(`Collection "${collection}" does not exist`)
            }

            const id = crypto.randomUUID()

            const document: Document = {
                id,
                ...data,
            }

            documents.set(id, document)

            return document as T
        },

        async update<T = unknown>(
            collection: string,
            id: string,
            data: Record<string, unknown>,
        ): Promise<T> {
            const documents = collections.get(collection)

            if (!documents) {
                throw new Error(`Collection "${collection}" does not exist`)
            }

            const existing = documents.get(id)

            if (!existing) {
                throw new Error(`Document "${id}" does not exist`)
            }

            const document: Document = {
                ...existing,
                ...data,
                id,
            }

            documents.set(id, document)

            return document as T
        },

        async delete<T = unknown>(
            collection: string,
            id: string,
        ): Promise<T> {
            const documents = collections.get(collection)

            if (!documents) {
                throw new Error(`Collection "${collection}" does not exist`)
            }

            const document = documents.get(id)

            if (!document) {
                return null as T
            }

            documents.delete(id)

            return document as T
        },
    },
}