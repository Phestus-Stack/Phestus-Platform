import {
    AuthProvider,
    AuthorizeOptions,
    AuthenticateOptions,
} from '@phestus/auth-module'
import { ToDo, User } from '../../routes/index.js'
import { service } from '../../../index.js';

type TestAuthRequest = {
    body?: {
        password?: string
    }
}

export const authProvider: AuthProvider = {
    slug: 'test',
    name: 'Test Provider',
    version: '0.1.0',
    moduleSlug: 'auth',

    async authorize(options: AuthorizeOptions) {
        if (options.action === 'create-user') {
            return true
        }

        if (options.actor && options.action === 'create-todo') {
            return true
        }

        if (!options.actor || !options.resource) {
            return false
        }

        const todo = options.resource as ToDo

        if (options.action === 'read-todo' && options.actor.id === todo.author) {
            return true
        }

        return false
    },

    async authenticate(options: AuthenticateOptions) {
        if (!options.request) {
            return null
        }

        const request = options.request as TestAuthRequest
        const password = request.body?.password

        if (!password) {
            return null
        }

        const result = await service.data.find<User>('users', {
            where: {
                fields: {
                    password: {
                        equals: password,
                    },
                },
            },
            limit: 1,
        })

        const user = result.docs[0]

        if (!user) {
            return null
        }

        return {
            id: user.id,
            type: 'user',
            metadata: {
                id: user.id,
                username: user.username,
                firstname: user.firstname,
                lastname: user.lastname,
            }
        }
    },
}