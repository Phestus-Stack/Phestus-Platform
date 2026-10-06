import { ApiModule } from '@phestus/api-module'
import { ExpressApiProvider } from '@phestus/express-api'
import { app } from '../../../app.js'
import { middleware } from '../middleware/middlewareModule.js'

const express = new ExpressApiProvider(app, middleware)

export const apiModule: ApiModule = new ApiModule(express)