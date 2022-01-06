import { RegisterDataAccess, RegisterDataFilter } from "../interactors/registers/types";
import {  Register } from "../interactors/registers/types";

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

    async getAll(filter?: RegisterDataFilter, registersIds?: string[]) {

        if (registersIds) {
            const registers = [];
            for (const id of registersIds) {
                registers.push(await this.get(id))
            }
            return registers;
        }

        let repoRegisters = Object.values(this.repo);

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

        return repoRegisters;
    };

}
