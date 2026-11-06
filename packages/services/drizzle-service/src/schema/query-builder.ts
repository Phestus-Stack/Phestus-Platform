import {
    and,
    or,
    not,
    eq,
    ne,
    gt,
    gte,
    lt,
    lte,
    like,
    inArray,
    notInArray,
    isNull,
    isNotNull,
    sql,
    getTableColumns,
} from 'drizzle-orm'

import {
    PhestusWhere,
    PhestusQueryValue,
} from '@phestus/sdk'

export const buildWhere = (
    table: any,
    where: PhestusWhere,
): any => {
    const conditions: any[] = []
    const columns = getTableColumns(table)

    if (where.fields) {
        for (const [field, condition] of Object.entries(where.fields)) {
            const column = columns[field]

            if (!column) {
                throw new Error(`Field "${field}" does not exist`)
            }

            if (
                condition !== null &&
                typeof condition === 'object' &&
                !Array.isArray(condition) &&
                !(condition instanceof Date)
            ) {
                for (const [operator, expected] of Object.entries(condition)) {
                    const value = expected as PhestusQueryValue

                    switch (operator) {
                        case 'equals':
                            conditions.push(
                                value === null
                                    ? isNull(column)
                                    : eq(column, value as never),
                            )
                            break

                        case 'notEquals':
                            conditions.push(
                                value === null
                                    ? isNotNull(column)
                                    : ne(column, value as never),
                            )
                            break

                        case 'contains':
                            conditions.push(
                                sql`${column} LIKE ${`%${escapeLike(String(value))}%`}`,
                            )
                            break

                        case 'startsWith':
                            conditions.push(
                                sql`${column} LIKE ${`${escapeLike(String(value))}%`}`,
                            )
                            break

                        case 'endsWith':
                            conditions.push(
                                sql`${column} LIKE ${`%${escapeLike(String(value))}`}`,
                            )
                            break

                        case 'greaterThan':
                            conditions.push(gt(column, value as never))
                            break

                        case 'greaterThanOrEqual':
                            conditions.push(gte(column, value as never))
                            break

                        case 'lessThan':
                            conditions.push(lt(column, value as never))
                            break

                        case 'lessThanOrEqual':
                            conditions.push(lte(column, value as never))
                            break

                        case 'in':
                            if (!Array.isArray(value)) {
                                throw new Error('"in" requires an array')
                            }

                            conditions.push(
                                value.length
                                    ? inArray(column, value as never[])
                                    : sql`false`,
                            )
                            break

                        case 'notIn':
                            if (!Array.isArray(value)) {
                                throw new Error('"notIn" requires an array')
                            }

                            conditions.push(
                                value.length
                                    ? notInArray(column, value as never[])
                                    : sql`true`,
                            )
                            break

                        case 'exists':
                            conditions.push(
                                value
                                    ? isNotNull(column)
                                    : isNull(column),
                            )
                            break

                        default:
                            throw new Error(`Unsupported operator "${operator}"`)
                    }
                }
            } else {
                conditions.push(
                    condition === null
                        ? isNull(column)
                        : eq(column, condition as never),
                )
            }
        }
    }

    if (where.and?.length) {
        const result = where.and.map(condition =>
            buildWhere(table, condition),
        )

        conditions.push(and(...result))
    }

    if (where.or?.length) {
        const result = where.or.map(condition =>
            buildWhere(table, condition),
        )

        conditions.push(or(...result))
    }

    if (where.not) {
        conditions.push(not(buildWhere(table, where.not)))
    }

    return conditions.length ? and(...conditions) : undefined
}

const escapeLike = (value: string): string => {
    return value.replace(/[\\%_]/g, '\\$&')
}