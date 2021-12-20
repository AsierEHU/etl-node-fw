import { uniqBy } from "lodash"
import { EntityFetcher, SyncContext, RegisterDataAccess, RegisterDataFilter, Register } from "../interactors/registers/types"

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

    async getRelativeRegisters(baseRegisters: Register[]): Promise<Register[]> {
        const uniqueBaseRegisters = uniqBy(baseRegisters, 'sourceRelativeId')
        const targetRegistersIds = uniqueBaseRegisters.map(baseRegister => baseRegister.sourceRelativeId) as string[]
        const targetRegisters = await this.registerDataAccess.getAll(undefined, targetRegistersIds)
        return targetRegisters
    }

    async getAbsoluteRegisters(baseRegisters: Register[]): Promise<Register[]> {
        const uniqueBaseRegisters = uniqBy(baseRegisters, 'sourceAbsoluteId')
        const targetRegistersIds = uniqueBaseRegisters.map(baseRegister => baseRegister.sourceAbsoluteId) as string[]
        const targetRegisters = await this.registerDataAccess.getAll(undefined, targetRegistersIds)
        return targetRegisters
    }
}
