import { uniqBy } from "lodash"
import { Entity, EntityFetcher, EntityWithMeta, Register, RegisterDataAccess, RegisterDataFilter, SyncContext } from "./types"

export const isOrigin = (register: Register<Entity>): boolean => {
    if (isByRowSource(register))
        return register.id == register.sourceAbsoluteId && register.id == register.sourceRelativeId
    else if (isByGroupSource(register))
        return register.sourceAbsoluteId == register.sourceRelativeId
    else
        throw Error("Unknown register origin type")
}

export function isByRowSource(register: Register<Entity>): boolean {
    return register.sourceRelativeId != null && !register.sourceRelativeId.startsWith("00000000")
}

export function isByGroupSource(register: Register<Entity>): boolean {
    return register.sourceRelativeId != null && register.sourceRelativeId.startsWith("00000000")
}


export class ContextEntityFetcher implements EntityFetcher {

    private readonly syncContext: SyncContext
    private readonly registerDataAccess: RegisterDataAccess
    private readonly fetchHistory: RegisterDataFilter[]

    constructor(syncContext: SyncContext, registerDataAccess: RegisterDataAccess) {
        this.syncContext = syncContext
        this.registerDataAccess = registerDataAccess
        this.fetchHistory = []
    }

    async getEntities(filter?: RegisterDataFilter) {
        filter = { ...filter, ...this.syncContext }
        this.fetchHistory.push(filter)
        const registers = await this.registerDataAccess.getAll(filter)
        return registers.map(register => { return { entity: register.entity, meta: register.meta } })
    }

    getHistory(): RegisterDataFilter[] {
        return this.fetchHistory;
    }

}
export class AdvancedRegisterFetcher {

    private readonly registerDataAccess: RegisterDataAccess

    constructor(registerDataAccess: RegisterDataAccess) {
        this.registerDataAccess = registerDataAccess
    }

    async getRelativeRegisters(baseRegisters: Register<Entity>[]): Promise<Register<Entity>[]> {
        const uniqueBaseRegisters = uniqBy(baseRegisters, 'sourceRelativeId')
        const targetRegistersIds = uniqueBaseRegisters.map(baseRegister => baseRegister.sourceRelativeId) as string[]
        const targetRegisters = await this.registerDataAccess.getAll(undefined, targetRegistersIds)
        return targetRegisters
    }

    async getAbsoluteRegisters(baseRegisters: Register<Entity>[]): Promise<Register<Entity>[]> {
        const uniqueBaseRegisters = uniqBy(baseRegisters, 'sourceAbsoluteId')
        const targetRegistersIds = uniqueBaseRegisters.map(baseRegister => baseRegister.sourceAbsoluteId) as string[]
        const targetRegisters = await this.registerDataAccess.getAll(undefined, targetRegistersIds)
        return targetRegisters
    }
}

export function isEntityWithMeta(entity?: any): entity is EntityWithMeta<Entity> {
    return entity?.entity != undefined
}

export const getWithMetaFormat = (entities: any[]): EntityWithMeta<Entity>[] => {
    return entities.map(entity => {
        if (isEntityWithMeta(entity)) {
            return entity
        }
        else {
            return {
                entity,
                meta: null
            }
        }
    })
}