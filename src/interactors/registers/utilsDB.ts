import { uniqBy } from "lodash"
import { SyncContext, Register, RegisterStatusTag } from "../../business/register"
import { EntityFetcher, RegisterDataAccess, RegisterDataFilter, MetaEntity, RegisterStats, ReservedEntityTypes } from "./types"

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
            entityType: ReservedEntityTypes.flowConfig,
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
        const sourceRegistersIds = uniqueBaseRegisters.map(baseRegister => baseRegister[sourceType]) as string[]

        let sourceRegisters = await this.registerDataAccess.getAll(undefined, sourceRegistersIds)
        let sourceRegistersFromSet: Register[] = []

        for (const sourceRegister of sourceRegisters) {
            if (sourceRegister.entityType === ReservedEntityTypes.setRegister) {
                const registersFromSetIds = sourceRegister.entity as string[]
                const registersFromSet = await this.registerDataAccess.getAll(undefined, registersFromSetIds)
                sourceRegistersFromSet = [...sourceRegistersFromSet, ...registersFromSet]
            }
        }

        sourceRegisters = sourceRegisters.filter(reg => reg.entityType !== ReservedEntityTypes.setRegister)
        sourceRegisters = [...sourceRegisters, ...sourceRegistersFromSet]
        sourceRegisters = uniqBy(sourceRegisters, "id")

        return sourceRegisters
    }

    async getRegistersAdapterSummary(adapterId: string): Promise<RegisterStats> { //TODO: Is entitiesSummary
        let outputRegisters = await this.registerDataAccess.getAll({ adapterId })
        outputRegisters = outputRegisters.filter(reg => reg.entityType !== ReservedEntityTypes.setRegister)
        const statusSummary = {
            registers_total: outputRegisters.length,
            registers_success: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.success).length,
            registers_failed: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.failed).length,
            registers_invalid: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.invalid).length,
            registers_skipped: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.skipped).length,
        };
        return statusSummary;
    }

    async getRegistersStepSummary(stepId: string, removeFailedRetries: boolean = false): Promise<RegisterStats> { //TODO: Is entitiesSummary
        let outputRegisters = await this.registerDataAccess.getAll({ stepId })
        outputRegisters = outputRegisters.filter(reg => reg.entityType !== ReservedEntityTypes.setRegister)

        if (removeFailedRetries) {
            const failedRegisters = await this.registerDataAccess.getAll({ stepId, registerStatus: RegisterStatusTag.failed })
            const uniquefailedRegisters = uniqBy(failedRegisters, "sourceRelativeId")
            outputRegisters = outputRegisters.filter(register => register.statusTag != RegisterStatusTag.failed)
            outputRegisters = [...outputRegisters, ...uniquefailedRegisters]
        }

        const statusSummary = {
            registers_total: outputRegisters.length,
            registers_success: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.success).length,
            registers_failed: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.failed).length,
            registers_invalid: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.invalid).length,
            registers_skipped: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.skipped).length,
        };

        return statusSummary;
    }

    async getStepRetries(stepId: string) {
        const failedRegisters = await this.registerDataAccess.getAll({ stepId, registerStatus: RegisterStatusTag.failed })
        const retries = uniqBy(failedRegisters, "syncContext.adapterId").length - 1
        return retries
    }
}
