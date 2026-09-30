import { EventBus } from '@phestus/sdk'

export const eventBus: EventBus = {
    async emit(event) {

    },

    async subscribe(type, handler) {
        return async () => { }
    }
}