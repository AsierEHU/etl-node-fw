import { RegisterDataAccess, RegisterDataFilter } from "../interactors/registers/types";
import { Entity, Register } from "../interactors/registers/types";

export class VolatileRegisterDataAccess implements RegisterDataAccess {

    private readonly repo: {
        [x: string]: Register<Entity>
    };

    constructor(registers?: Register<Entity>[]) {
        this.repo = {}
        if (registers)
            for (const register of registers) {
                if (this.repo[register.id])
                    throw new Error(`Register with id ${register.id} already exist`);
                this.repo[register.id] = register
            }
    }

    async save(register: Register<Entity>) {
        this.repo[register.id] = register
    };

    async get(id: string) {
        return this.repo[id]
    }

    async saveAll(registers: Register<Entity>[]) {
        for (const register of registers) {
            await this.save(register)
        }
    };

    async getAll(filter?: RegisterDataFilter, registersIds?: string[]) {

        if (registersIds) {
            const registers = [];
            for (const id of registersIds) {
                registers.push(await this.get(id))
            }
            return registers;
        }

        let repoRegisters = Object.values(this.repo);

        if (filter?.apdaterId)
            repoRegisters = repoRegisters.filter(repoRegister => repoRegister.syncContext.apdaterId == filter.apdaterId)
        if (filter?.stepId)
            repoRegisters = repoRegisters.filter(repoRegister => repoRegister.syncContext.stepId == filter.stepId)
        if (filter?.flowId)
            repoRegisters = repoRegisters.filter(repoRegister => repoRegister.syncContext.flowId == filter.flowId)
        if (filter?.registerType)
            repoRegisters = repoRegisters.filter(repoRegister => repoRegister.entityType == filter.registerType)
        if (filter?.registerStatus)
            repoRegisters = repoRegisters.filter(repoRegister => repoRegister.statusTag == filter.registerStatus)

        return repoRegisters;
    };

}
