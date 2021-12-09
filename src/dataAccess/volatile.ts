import { Register, RegisterDataAccess, RegisterDataContext, RegisterDataFilter } from "../interactors/registers/types";


// export class VolatileFlowDataAccess implements FlowDataAccess{

//     private repo = {};    

//     async save(flowData: FlowData){
//         this.repo[flowData.id] = flowData;
//     }

//     async get(id:string){
//         return this.repo[id];
//     }
// }


// export class VolatileStepDataAccess implements StepDataAccess{

//     private repo = {};    

//     async save(stepStatus:StepStatus){
//         this.repo[stepStatus.id] = stepStatus;
//     }

//     async get(id:string){
//         return this.repo[id];
//     }
// }


// export class VolatileAdapterDataAccess implements AdapterDataAccess{

//     private repo = {};    

//     async save(stepStatus:StepStatus){
//         this.repo[stepStatus.id] = stepStatus;
//     }

//     async get(id:string){
//         return this.repo[id];
//     }
// }

export class VolatileRegisterDataAccess implements RegisterDataAccess<any>{

    private repo: { [Properties in keyof string as string]: {
        register: Register<any>,
        context: RegisterDataContext
    } };

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

    async getAll(filter?: RegisterDataFilter) {
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
