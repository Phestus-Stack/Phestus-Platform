import { ApiEndpoint } from '@phestus/api-module'
import { AuthActor } from '@phestus/auth-module';
import { service } from '../../index.js'

export const healthEndpoint: ApiEndpoint = {
    method: 'GET',
    path: '/health',

    async handler() {
        console.log('HEALTH ROUTE HIT')

        return {
            status: 200,
            data: {
                status: 'ok',
            },
        }
    },
}

export type CreateUserBody = {
    username: string
    firstname: string
    lastname: string
    password: string
}

export type User = {
    id: string
    username: string
    firstname: string
    lastname: string
    password: string
}

export const createUserEndpoint: ApiEndpoint<
    CreateUserBody,
    Record<string, string>,
    Record<string, string>,
    User
> = {
    method: 'POST',
    path: '/create-user',

    async handler(request) {
        console.log('Creating user')

        const user = await service.data.create<User>('users', {
            username: request.body.username,
            firstname: request.body.firstname,
            lastname: request.body.lastname,
            password: request.body.password,
        })

        return {
            status: 201,
            data: user,
        }
    },
}

export type CreateToDoBody = {
    name: string
    contents: string
    author: string
}

export type ToDo = {
    id: string
    name: string
    contents: string
    author: string
}

export const createToDoEndpoint: ApiEndpoint<
    CreateToDoBody,
    Record<string, string>,
    Record<string, string>,
    ToDo
> = {
    method: 'POST',
    path: '/create-todo',

    middleware: [
        {
            name: "authentication",
        },
        {
            name: "authorization",
            options: {
                action: "create-todo",
            },
        },
    ],

    async handler(request) {
        const actor = request.context.actor as AuthActor

        const todo = await service.data.create<ToDo>('todos', {
            name: request.body.name,
            contents: request.body.contents,
            author: actor.id,
        })

        return {
            status: 201,
            data: todo,
        }
    }
}