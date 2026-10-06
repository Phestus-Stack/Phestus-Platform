import { phestus } from './phestus.config.js'
import { app } from './app.js'
import { createToDoEndpoint, createUserEndpoint, healthEndpoint } from './phestus/routes/index.js'
import { ApiModule } from '@phestus/api-module';
import { AuthModule } from '@phestus/auth-module';
import { MiddlewareModule } from '@phestus/middleware-module';
import { authenticateMiddleware, authorizationMiddleware } from './phestus/modules/middleware/methods.js';

await phestus.initialize()

export const service = phestus.getService()
export const authModule = phestus.getModule<AuthModule>('auth')
const api = phestus.getModule<ApiModule>('api')
const middleware = phestus.getModule<MiddlewareModule>('middleware')

await service.schema.ensure('users', {
    slug: 'users',
    name: 'User',
    version: '0.1.0',
    fields: {
        username: { type: 'string', required: true, unique: true },
        firstname: { type: 'string', required: true },
        lastname: { type: 'string', required: true },
        password: { type: 'string', required: true },
    },
})

await service.schema.ensure('todos', {
    slug: 'todos',
    name: 'Todo',
    version: '0.1.0',
    fields: {
        name: { type: 'string', required: true, },
        contents: { type: 'text', required: true, },
        author: {
            type: 'relationship', required: true, relation: { collection: 'users', },
        },
    },
})

middleware.use(authorizationMiddleware)
middleware.use(authenticateMiddleware)

api.registerEndpoint(healthEndpoint)
api.registerEndpoint(createUserEndpoint)
api.registerEndpoint(createToDoEndpoint)

const port = 3000;

app.listen(port, () => {
    console.log(`Express started on port ${port}`);
});