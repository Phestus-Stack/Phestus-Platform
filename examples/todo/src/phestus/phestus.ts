import { PhestusConfig } from '@phestus/core'
import { logger } from './logger.js';
import { service } from './service.js';
import { eventBus } from './eventBus.js';
import { apiModule } from './modules/apiModule.js';

export const phestusConfig: PhestusConfig = {
    logger: logger,
    service: service,
    eventBus: eventBus,

    modules: [
        apiModule
    ]
}