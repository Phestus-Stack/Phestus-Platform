import { AuthModule } from '@phestus/auth-module'
import { authProvider } from './authProvider.js';

export const authModule: AuthModule = new AuthModule(authProvider)