import { logger } from './phestus/core/logger.js';
import { service } from './phestus/core/service.js';
import { eventBus } from './phestus/core/eventBus.js';
import { apiModule } from './phestus/modules/api/apiModule.js';
import { Phestus, PhestusConfig } from '@phestus/core';
import { authModule } from './phestus/modules/auth/authModule.js';
import { middleware } from './phestus/modules/middleware/middlewareModule.js';

export const phestusConfig: PhestusConfig = {
    logger: logger,
    service: service,
    eventBus: eventBus,

    modules: [
        apiModule,
        authModule,
        middleware
    ]
}

export const phestus = new Phestus(phestusConfig)