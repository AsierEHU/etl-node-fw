import { Register, RegisterDataAccess, RegisterDataContext, RegisterDataFilter } from "../interactors/registers/types";

export class VolatileRegisterDataAccess implements RegisterDataAccess<any>{

    private repo: {
        [x: string]: {
            register: Register<any>,
            context: RegisterDataContext
        }
    };

    constructor(dependencies?: any) {
        this.repo = dependencies?.repo || {}
    }

    async save(register: Register<any>, context: RegisterDataContext) {
        this.repo[register.id] = {
            register,
            context,
        }
    };

    async get(id: string) {
        return this.repo[id]?.register
    }

    async saveAll(registers: Register<any>[], context: RegisterDataContext) {
        for (const register of registers) {
            await this.save(register, context)
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

        let registers = repoRegisters.map(repoRegister => {
            return repoRegister.register;
        });

        if (filter?.registerType)
            registers = registers.filter(registers => registers.entityType == filter.registerType)
        if (filter?.registerStatus)
            registers = registers.filter(registers => registers.statusTag == filter.registerStatus)

        return registers;
    };

}
