import { RegisterDataAccess } from "../common/registers";
import { Report } from "./types";


export class RegistersFlowTraceReport implements Report {

    private readonly registerDataAccess: RegisterDataAccess

    constructor(dependencies: any) {
        this.registerDataAccess = dependencies.registerDataAccess
    }

    async getReport(config: { flowId: string, sourceId: string, sourceType: 'sourceEntityId' | 'sourceAbsoluteId' }): Promise<any> {
        const { flowId, sourceId, sourceType } = config
        const registers = await this.registerDataAccess.getAll({ flowId: flowId })
        //TODO: Filter by registerSourceId
        const trace = registers.filter(reg => reg[sourceType] === sourceId)
        const orderedTraceRegisters = trace.sort((a, b) => {
            if (a.date < b.date) {
                return 1
            }
            return -1
        })
        return orderedTraceRegisters
    }
}
