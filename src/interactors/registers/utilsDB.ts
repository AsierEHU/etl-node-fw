import { uniqBy } from "lodash"
import { EntityFetcher, SyncContext, RegisterDataAccess, RegisterDataFilter, Register, MetaEntity, RegisterStatusTag, RegisterStats, reservedRegisterEntityTypes } from "./types"

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
        return registers.map(register => {
            const metaEntity: MetaEntity = {
                $entity: register.entity,
                $meta: register.meta,
                $id: register.sourceEntityId || undefined,
            }
            return metaEntity
        })
    }

    async getFlowConfig() {
        const configPushedRegisters = await this.registerDataAccess.getAll({
            registerType: reservedRegisterEntityTypes.flowConfig,
            flowId: this.syncContext.flowId
        })
        return configPushedRegisters[0]?.entity
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
        //TODO: SET relatives registers types
        const uniqueBaseRegisters = uniqBy(baseRegisters, 'sourceRelativeId')
        const targetRegistersIds = uniqueBaseRegisters.map(baseRegister => baseRegister.sourceRelativeId) as string[]
        const targetRegisters = await this.registerDataAccess.getAll(undefined, targetRegistersIds)
        return targetRegisters
    }

    async getAbsoluteRegisters(baseRegisters: Register[]): Promise<Register[]> {
        //TODO: SET absolute registers types
        const uniqueBaseRegisters = uniqBy(baseRegisters, 'sourceAbsoluteId')
        const targetRegistersIds = uniqueBaseRegisters.map(baseRegister => baseRegister.sourceAbsoluteId) as string[]
        const targetRegisters = await this.registerDataAccess.getAll(undefined, targetRegistersIds)
        return targetRegisters
    }

    async getRegistersSummary(adapterId: string): Promise<RegisterStats> {
        const outputRegisters = await this.registerDataAccess.getAll({ adapterId })
        const statusSummary = {
            registers_total: outputRegisters.length,
            registers_success: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.success).length,
            registers_failed: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.failed).length,
            registers_invalid: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.invalid).length,
            registers_skipped: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.skipped).length,
        };
        return statusSummary;
    }
}
