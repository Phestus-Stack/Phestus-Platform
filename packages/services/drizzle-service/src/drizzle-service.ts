import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import {
    sql,
    eq,
    and,
    isNull,
    getTableColumns,
    count,
} from 'drizzle-orm'

import {
    PhestusService,
    PhestusSchema,
    PhestusQuery,
    PhestusWhere,
    FindResult,
} from '@phestus/sdk'

import {
    buildTable,
    getColumnType,
} from './data/schema-builder'

import { buildWhere } from './schema/query-builder'

type DynamicTable = any

const getRows = <T>(
    result: T[] | { rows: T[] },
): T[] => {
    return Array.isArray(result)
        ? result
        : result.rows
}

const validateIdentifier = (value: string): void => {
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
        throw new Error(`Invalid PostgreSQL identifier "${value}"`)
    }
}

const getSystemFields = (schema: PhestusSchema): string[] => {
    const fields = ['id', ...Object.keys(schema.fields)]

    if (schema.options?.timestamps) {
        fields.push('createdAt', 'updatedAt')
    }

    if (schema.options?.softDelete) {
        fields.push('deletedAt')
    }

    if (schema.options?.versioning) {
        fields.push('version')
    }

    return fields
}

const getDefaultSQL = (value: unknown): string => {
    if (value === null) return 'NULL'

    if (typeof value === 'number') {
        if (!Number.isFinite(value)) {
            throw new Error('Invalid numeric default')
        }

        return String(value)
    }

    if (typeof value === 'boolean') {
        return value ? 'TRUE' : 'FALSE'
    }

    const serialized = value instanceof Date
        ? value.toISOString()
        : typeof value === 'object'
            ? JSON.stringify(value)
            : String(value)

    return `'${serialized.replace(/'/g, "''")}'`
}

const getColumnDefinition = (
    name: string,
    field: import('@phestus/sdk').PhestusSchemaField,
): string => {
    validateIdentifier(name)

    let definition = `"${name}" ${getColumnType(field)}`

    if (field.required) {
        definition += ' NOT NULL'
    }

    if (field.unique) {
        definition += ' UNIQUE'
    }

    if (field.default !== undefined) {
        definition += ` DEFAULT ${getDefaultSQL(field.default)}`
    }

    return definition
}

const createTableSQL = (
    collection: string,
    schema: PhestusSchema,
): string => {
    validateIdentifier(collection)

    const definitions = [
        '"id" text PRIMARY KEY',
    ]

    for (const [name, field] of Object.entries(schema.fields)) {
        definitions.push(getColumnDefinition(name, field))
    }

    if (schema.options?.timestamps) {
        definitions.push('"createdAt" timestamp with time zone NOT NULL DEFAULT NOW()')
        definitions.push('"updatedAt" timestamp with time zone NOT NULL DEFAULT NOW()')
    }

    if (schema.options?.softDelete) {
        definitions.push('"deletedAt" timestamp with time zone')
    }

    if (schema.options?.versioning) {
        definitions.push('"version" double precision NOT NULL DEFAULT 1')
    }

    return `CREATE TABLE "${collection}" (${definitions.join(', ')})`
}

const createIndexes = async (
    db: NodePgDatabase<any>,
    collection: string,
    schema: PhestusSchema,
): Promise<void> => {
    for (const [name, field] of Object.entries(schema.fields)) {
        if (!field.indexed || field.unique) continue

        validateIdentifier(name)

        const indexName = `${collection}_${name}_idx`

        validateIdentifier(indexName)

        await db.execute(sql.raw(
            `CREATE INDEX IF NOT EXISTS "${indexName}" ON "${collection}" ("${name}")`,
        ))
    }
}

export const createDrizzleService = (
    db: NodePgDatabase<any>,
): PhestusService => {
    const schemas = new Map<string, PhestusSchema>()
    const tables = new Map<string, DynamicTable>()

    const getTable = (collection: string): DynamicTable => {
        const table = tables.get(collection)

        if (!table) {
            throw new Error(`Collection "${collection}" does not exist`)
        }

        return table
    }

    const getSchema = (collection: string): PhestusSchema => {
        const schema = schemas.get(collection)

        if (!schema) {
            throw new Error(`Schema "${collection}" does not exist`)
        }

        return schema
    }

    const applySoftDelete = (
        collection: string,
        where: PhestusWhere | undefined,
    ): any => {
        const schema = schemas.get(collection)

        const conditions = []

        if (where) {
            conditions.push(buildWhere(getTable(collection), where))
        }

        if (schema?.options?.softDelete) {
            conditions.push(isNull(getTable(collection).deletedAt))
        }

        return conditions.length ? and(...conditions) : undefined
    }

    const registerSchema = (
        collection: string,
        schema: PhestusSchema,
    ): void => {
        schemas.set(collection, schema)
        tables.set(collection, buildTable(collection, schema))
    }

    const metadataTable = '_phestus_schemas'

    return {
        async initialize() {
            await db.execute(sql`
                CREATE TABLE IF NOT EXISTS "_phestus_schemas" (
                    "collection" text PRIMARY KEY,
                    "schema" jsonb NOT NULL
                )
            `)

            const result = await db.execute(
                sql`SELECT "collection", "schema" FROM "_phestus_schemas"`,
            )

            for (const row of result.rows as {
                collection: string
                schema: PhestusSchema
            }[]) {
                registerSchema(row.collection, row.schema)
            }
        },

        async shutdown() {
            // The database connection is owned by the application.
            // Close it separately when the application shuts down.
        },

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

                validateIdentifier(collection)

                await db.execute(sql.raw(
                    createTableSQL(collection, schema),
                ))

                await createIndexes(db, collection, schema)

                await db.execute(sql`
                    INSERT INTO "_phestus_schemas" ("collection", "schema")
                    VALUES (${collection}, ${JSON.stringify(schema)}::jsonb)
                `)

                registerSchema(collection, schema)
            },

            async update(collection, schema) {
                const existing = getSchema(collection)

                for (const [name, field] of Object.entries(schema.fields)) {
                    validateIdentifier(name)

                    if (existing.fields[name]) {
                        if (
                            getColumnType(existing.fields[name]) !==
                            getColumnType(field)
                        ) {
                            throw new Error(
                                `Changing the type of field "${name}" requires a migration`,
                            )
                        }

                        continue
                    }

                    let definition = getColumnDefinition(name, field)

                    // A newly added required field needs a default when
                    // existing records are already present.
                    if (field.required && field.default === undefined) {
                        const result = await db.execute(
                            sql.raw(`SELECT EXISTS (SELECT 1 FROM "${collection}" LIMIT 1) AS "has_rows"`),
                        )

                        const hasRows = (result.rows[0] as {
                            has_rows: boolean
                        }).has_rows

                        if (hasRows) {
                            throw new Error(
                                `Cannot add required field "${name}" to a populated collection without a default`,
                            )
                        }
                    }

                    await db.execute(sql.raw(
                        `ALTER TABLE "${collection}" ADD COLUMN ${definition}`,
                    ))
                }

                // Existing fields cannot be removed or have their types
                // changed through this basic update operation.
                await createIndexes(db, collection, schema)

                await db.execute(sql`
                    UPDATE "_phestus_schemas"
                    SET "schema" = ${JSON.stringify(schema)}::jsonb
                    WHERE "collection" = ${collection}
                `)

                registerSchema(collection, schema)
            },

            async ensure(collection, schema) {
                if (schemas.has(collection)) return

                await this.create(collection, schema)
            },
        },

        data: {
            async find<T = unknown>(
                collection: string,
                query?: PhestusQuery,
            ): Promise<FindResult<T>> {
                const table = getTable(collection)
                const offset = Math.max(0, query?.offset ?? 0)
                const limit = Math.max(0, query?.limit ?? 10)

                const where = applySoftDelete(
                    collection,
                    query?.where,
                )

                const totalResult = await db
                    .select({ total: count() })
                    .from(table)
                    .where(where)

                const totalDocs = Number(totalResult[0]?.total ?? 0)

                const columns = getTableColumns(table)

                const selection: Record<string, any> = {}

                if (query?.select?.length) {
                    for (const field of query.select) {
                        if (!columns[field]) {
                            throw new Error(`Field "${field}" does not exist`)
                        }

                        selection[field] = columns[field]
                    }
                } else {
                    Object.assign(selection, columns)
                }

                const orderBy = (query?.sort
                    ? Array.isArray(query.sort)
                        ? query.sort
                        : [query.sort]
                    : []
                ).map(field => {
                    const descending = field.startsWith('-')
                    const name = descending ? field.slice(1) : field

                    if (!columns[name]) {
                        throw new Error(`Field "${name}" does not exist`)
                    }

                    return descending
                        ? sql`${columns[name]} DESC`
                        : sql`${columns[name]} ASC`
                })

                let builder = db
                    .select(selection)
                    .from(table)
                    .$dynamic()

                if (where) {
                    builder = builder.where(where)
                }

                if (orderBy.length) {
                    builder = builder.orderBy(...orderBy)
                }

                const docs = await builder
                    .limit(limit)
                    .offset(offset)

                return {
                    docs: docs as T[],
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
                const table = getTable(collection)

                const where = applySoftDelete(collection, undefined)

                const conditions = [
                    eq(table.id, id),
                ]

                if (where) conditions.push(where)

                const result = await db
                    .select()
                    .from(table)
                    .where(and(...conditions))
                    .limit(1)

                return (result[0] as T) ?? null
            },

            async count(
                collection: string,
                query?: PhestusQuery,
            ): Promise<number> {
                const table = getTable(collection)

                const result = await db
                    .select({ total: count() })
                    .from(table)
                    .where(applySoftDelete(collection, query?.where))

                return Number(result[0]?.total ?? 0)
            },

            async create<T = unknown>(
                collection: string,
                data: unknown,
            ): Promise<T> {
                const table = getTable(collection)
                const schema = getSchema(collection)

                const now = new Date()

                const document: Record<string, unknown> = {
                    ...(data as Record<string, unknown>),
                    id: crypto.randomUUID(),
                }

                if (schema.options?.timestamps) {
                    document.createdAt = now
                    document.updatedAt = now
                }

                if (schema.options?.versioning) {
                    document.version = 1
                }

                const result = await db
                    .insert(table)
                    .values(document)
                    .returning()

                return getRows(result)[0] as T
            },

            async update<T = unknown>(
                collection: string,
                id: string,
                data: unknown,
            ): Promise<T> {
                const table = getTable(collection)
                const schema = getSchema(collection)

                const document = {
                    ...(data as Record<string, unknown>),
                }

                delete document.id
                delete document.createdAt
                delete document.deletedAt

                if (schema.options?.timestamps) {
                    document.updatedAt = new Date()
                }

                if (schema.options?.versioning) {
                    document.version = sql`${table.version} + 1`
                }

                const result = await db
                    .update(table)
                    .set(document)
                    .where(
                        and(
                            eq(table.id, id),
                            applySoftDelete(collection, undefined),
                        ),
                    )
                    .returning()

                if (!result.length) {
                    throw new Error(`Document "${id}" does not exist`)
                }

                return result[0] as T
            },

            async delete<T = unknown>(
                collection: string,
                id: string,
            ): Promise<T> {
                const table = getTable(collection)
                const schema = getSchema(collection)

                if (schema.options?.softDelete) {
                    const result = await db
                        .update(table)
                        .set({
                            deletedAt: new Date(),
                        })
                        .where(
                            and(
                                eq(table.id, id),
                                isNull(table.deletedAt),
                            ),
                        )
                        .returning()

                    return (result[0] ?? null) as T
                }

                const result = await db
                    .delete(table)
                    .where(eq(table.id, id))
                    .returning()

                return (getRows(result)[0] ?? null) as T
            },
        },
    }
}