import { uniqBy, uniq } from "lodash"
import { EntityFetcher, SyncContext, RegisterDataAccess, RegisterDataFilter, Register, MetaEntity, RegisterStatusTag, RegisterStats, reservedRegisterEntityTypes } from "./types"
import { getSetSourceIdTypes, isRowSourceType, isSetSourceType } from "./utils"

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
        return this.getSourceRegisters('sourceRelativeId', baseRegisters)
    }

    async getAbsoluteRegisters(baseRegisters: Register[]): Promise<Register[]> {
        return this.getSourceRegisters('sourceAbsoluteId', baseRegisters)
    }

    private async getSourceRegisters(sourceType: 'sourceRelativeId' | 'sourceAbsoluteId', baseRegisters: Register[]) {
        const uniqueBaseRegisters = uniqBy(baseRegisters, sourceType)
        const targetRegistersIds = uniqueBaseRegisters.map(baseRegister => baseRegister[sourceType]) as string[]

        const setRegisterIds = [];
        const rowRegisterIds = [];

        for (const targetRegistersId of targetRegistersIds) {
            if (isSetSourceType(targetRegistersId)) {
                setRegisterIds.push(targetRegistersId)
            } else if (isRowSourceType(targetRegistersId)) {
                rowRegisterIds.push(targetRegistersId)
            } else {
                throw Error("Unknown source type")
            }
        }

        let setRegisterTypes: string[] = []
        for (const setRegisterId of setRegisterIds) {
            setRegisterTypes.push(...getSetSourceIdTypes(setRegisterId))
        }
        setRegisterTypes = uniq(setRegisterTypes)

        let targetRegisters = await this.registerDataAccess.getAll(undefined, rowRegisterIds)
        for (const registerType of setRegisterTypes) {
            const setRegisters = await this.registerDataAccess.getAll(
                {
                    registerType: registerType,
                    registerStatus: RegisterStatusTag.success
                }
            )
            targetRegisters.push(...setRegisters)
        }
        targetRegisters = uniqBy(targetRegisters, "id")

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
