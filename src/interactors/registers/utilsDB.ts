import { uniqBy } from "lodash"
import { SyncContext, Register, RegisterStatusTag, ReservedEntityTypes } from "../../business/register"
import { EntityFetcher, RegisterDataAccess, RegisterDataFilter, MetaEntity, RegisterStats } from "./types"

export class ContextEntityFetcher implements EntityFetcher {

    private readonly syncContext: SyncContext
    private readonly registerDataAccess: RegisterDataAccess
    private readonly fetchHistory: RegisterDataFilter[]

    constructor(syncContext: SyncContext, registerDataAccess: RegisterDataAccess) {
        this.syncContext = syncContext
        this.registerDataAccess = registerDataAccess
        this.fetchHistory = []
    }

    async getMetaEntities(filter?: RegisterDataFilter) {
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

        let sourceRegisters = await this.registerDataAccess.getAll({ registersIds: sourceRegistersIds })
        let sourceRegistersFromSet: Register[] = []

        for (const sourceRegister of sourceRegisters) {
            if (sourceRegister.entityType === ReservedEntityTypes.setRegister) {
                const registersFromSetIds = sourceRegister.entity as string[]
                const registersFromSet = await this.registerDataAccess.getAll({ registersIds: registersFromSetIds })
                sourceRegistersFromSet = [...sourceRegistersFromSet, ...registersFromSet]
            }
        }

        sourceRegisters = sourceRegisters.filter(reg => reg.entityType !== ReservedEntityTypes.setRegister)
        sourceRegisters = [...sourceRegisters, ...sourceRegistersFromSet]
        sourceRegisters = uniqBy(sourceRegisters, "id")

        return sourceRegisters
    }

    async getRegistersAdapterSummary(adapterId: string): Promise<RegisterStats> {
        const outputRegisters = await this.registerDataAccess.getAll({ adapterId, excludeOptions: { excludeReservedEntityTypes: true, excludeEntityPayload: true } })
        const statusSummary = {
            registers_total: outputRegisters.length,
            registers_success: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.success).length,
            registers_failed: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.failed).length,
            registers_invalid: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.invalid).length,
            registers_skipped: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.skipped).length,
        };
        return statusSummary;
    }

    async getRegistersStepSummary(stepId: string, excludeFailedRetries: boolean = false): Promise<RegisterStats> {
        let outputRegisters = await this.registerDataAccess.getAll({ stepId, excludeOptions: { excludeReservedEntityTypes: true, excludeEntityPayload: true } })

        if (excludeFailedRetries) {
            const failedRegisters = await this.registerDataAccess.getAll({ stepId, registerStatus: RegisterStatusTag.failed, excludeOptions: { excludeEntityPayload: true } })
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
