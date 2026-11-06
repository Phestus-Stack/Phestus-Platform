import {
    pgTable,
    text,
    doublePrecision,
    boolean,
    timestamp,
    jsonb,
} from 'drizzle-orm/pg-core'

import {
    PhestusSchema,
    PhestusSchemaField,
} from '@phestus/sdk'

export type DrizzleTable = ReturnType<typeof pgTable>

export const getColumnType = (field: PhestusSchemaField): string => {
    switch (field.type) {
        case 'string':
        case 'text':
        case 'email':
        case 'url':
            return 'text'

        case 'number':
            return 'double precision'

        case 'boolean':
            return 'boolean'

        case 'date':
            return 'timestamp with time zone'

        case 'json':
        case 'richText':
        case 'array':
        case 'object':
        case 'relationship':
            return 'jsonb'

        default:
            throw new Error(`Unsupported field type "${field.type}"`)
    }
}

export const getColumnBuilder = (field: PhestusSchemaField) => {
    let column

    switch (field.type) {
        case 'string':
        case 'text':
        case 'email':
        case 'url':
            column = text()
            break

        case 'number':
            column = doublePrecision()
            break

        case 'boolean':
            column = boolean()
            break

        case 'date':
            column = timestamp({ withTimezone: true })
            break

        case 'json':
        case 'richText':
        case 'array':
        case 'object':
        case 'relationship':
            column = jsonb()
            break

        default:
            throw new Error(`Unsupported field type "${field.type}"`)
    }

    if (field.required) {
        column = column.notNull()
    }

    if (field.unique) {
        column = column.unique()
    }

    if (field.default !== undefined) {
        column = column.default(field.default as never)
    }

    return column
}

export const buildTable = (
    collection: string,
    schema: PhestusSchema,
): DrizzleTable => {
    const columns: Record<string, any> = {
        id: text().primaryKey(),
    }

    for (const [name, field] of Object.entries(schema.fields)) {
        columns[name] = getColumnBuilder(field)
    }

    if (schema.options?.timestamps) {
        columns.createdAt = timestamp({ withTimezone: true })
            .notNull()

        columns.updatedAt = timestamp({ withTimezone: true })
            .notNull()
    }

    if (schema.options?.softDelete) {
        columns.deletedAt = timestamp({ withTimezone: true })
    }

    if (schema.options?.versioning) {
        columns.version = doublePrecision()
            .notNull()
            .default(1)
    }

    return pgTable(collection, columns) as DrizzleTable
}