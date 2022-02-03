import { uniqBy } from "lodash"
import { Register, ReservedEntityTypes, RegisterStatusTag } from "../../business/register"
import { RegisterDataAccess } from "../common/registers"

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

    async getStepRetries(stepId: string) {
        const failedRegisters = await this.registerDataAccess.getAll({ stepId, registerStatus: RegisterStatusTag.failed })
        const retries = uniqBy(failedRegisters, "syncContext.adapterId").length - 1
        return retries
    }
}
