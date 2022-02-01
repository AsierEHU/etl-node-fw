import { Register, ReservedEntityTypes } from "../business/register";
import { RegisterDataAccess, RegisterDataFilter } from "../interactors/registers/types";

export class VolatileRegisterDataAccess implements RegisterDataAccess {

    private readonly repo: {
        [x: string]: Register
    };

    constructor(registers?: Register[]) {
        this.repo = {}
        if (registers)
            for (const register of registers) {
                if (this.repo[register.id])
                    throw new Error(`Register with id ${register.id} already exist`);
                this.repo[register.id] = register
            }
    }

    async save(register: Register) {
        this.repo[register.id] = register
    };

    async get(id: string) {
        return this.repo[id]
    }

    async saveAll(registers: Register[]) {
        for (const register of registers) {
            await this.save(register)
        }
    };

    async getAll(filter?: RegisterDataFilter) {
        const repoRegisters = this.applyFiltersAndOptions(filter)
        return repoRegisters;
    };

    async removeAll(filter?: RegisterDataFilter) {
        const repoRegisters = this.applyFiltersAndOptions(filter)
        const repoRegisterIds = repoRegisters.map(reg => reg.id)
        for (const id of repoRegisterIds) {
            delete this.repo[id]
        }
    }

    private applyFiltersAndOptions(filter?: RegisterDataFilter) {
        let repoRegisters = Object.values(this.repo);

        if (filter?.excludeOptions?.excludeReservedEntityTypes) {
            const reservedEntityTypes = [ReservedEntityTypes.flowConfig, ReservedEntityTypes.setRegister]
            repoRegisters = repoRegisters.filter(repoRegister => !reservedEntityTypes.includes(repoRegister.entityType as ReservedEntityTypes))
        }

        if (filter?.registersIds)
            repoRegisters = repoRegisters.filter(repoRegister => filter.registersIds?.includes(repoRegister.id))
        if (filter?.adapterId)
            repoRegisters = repoRegisters.filter(repoRegister => repoRegister.syncContext.adapterId == filter.adapterId)
        if (filter?.stepId)
            repoRegisters = repoRegisters.filter(repoRegister => repoRegister.syncContext.stepId == filter.stepId)
        if (filter?.flowId)
            repoRegisters = repoRegisters.filter(repoRegister => repoRegister.syncContext.flowId == filter.flowId)
        if (filter?.entityType)
            repoRegisters = repoRegisters.filter(repoRegister => repoRegister.entityType == filter.entityType)
        if (filter?.registerStatus)
            repoRegisters = repoRegisters.filter(repoRegister => repoRegister.statusTag == filter.registerStatus)

        if (filter?.excludeOptions?.excludeEntityPayload) {
            repoRegisters = repoRegisters.map(reg => {
                return { ...reg, entity: null }
            })
        }

        return repoRegisters
    }

}
