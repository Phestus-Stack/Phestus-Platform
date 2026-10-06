import { Middleware } from '@phestus/middleware-module'
import { authModule } from '../../../index.js'
import { AuthActor, AuthModule } from '@phestus/auth-module';

export const authenticateMiddleware: Middleware = {
    name: 'authentication',

    async handle(request, next, options) {
        const actor = await authModule.authenticate({
            request,
        })

        if (!actor) {
            return {
                status: 401,
                data: {
                    error: 'Unauthorized',
                },
            }
        }

        request.context = {
            ...request.context,
            actor,
        }

        return next()
    },
}

export const authorizationMiddleware: Middleware = {
    name: 'authorization',

    async handle(request, next, options) {
        const action = options?.action as string;

        const actor = request.context.actor as AuthActor;

        const authorized = await authModule.authorize({
            actor,
            action,
            context: request.context,
        });

        if (!authorized) {
            return {
                status: 403,
                data: {
                    error: 'Forbidden',
                },
            };
        }

        return next();
    },
}