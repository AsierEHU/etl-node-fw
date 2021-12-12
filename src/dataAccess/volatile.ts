import { RegisterDataAccess, RegisterDataFilter } from "../interactors/adapters/definitions/my_first_definition";
import { Register } from "../interactors/registers/types";

export class VolatileRegisterDataAccess implements RegisterDataAccess<any>{

    private repo: {
        [x: string]: Register<any>
    };

    constructor(dependencies?: any) {
        this.repo = dependencies?.repo || {}
    }

    async save(register: Register<any>) {
        this.repo[register.id] = register
    };

    async get(id: string) {
        return this.repo[id]
    }

    async saveAll(registers: Register<any>[]) {
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
            repoRegisters = repoRegisters.filter(repoRegister => repoRegister.context.apdaterId == filter.apdaterId)
        if (filter?.stepId)
            repoRegisters = repoRegisters.filter(repoRegister => repoRegister.context.stepId == filter.stepId)
        if (filter?.flowId)
            repoRegisters = repoRegisters.filter(repoRegister => repoRegister.context.flowId == filter.flowId)
        if (filter?.registerType)
            repoRegisters = repoRegisters.filter(repoRegister => repoRegister.entityType == filter.registerType)
        if (filter?.registerStatus)
            repoRegisters = repoRegisters.filter(repoRegister => repoRegister.statusTag == filter.registerStatus)

        return repoRegisters;
    };

}
