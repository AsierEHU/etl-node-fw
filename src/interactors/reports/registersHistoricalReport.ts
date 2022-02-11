
import { ProcessStatusDataAccess } from "../common/processes";
import { RegisterDataAccess } from "../common/registers";
import { Report } from "./types";


export class RegistersHistoricalReport implements Report {

    private readonly registerDataAccess: RegisterDataAccess
    private readonly processStatusDataAccess: ProcessStatusDataAccess

    constructor(dependencies: any) {
        this.registerDataAccess = dependencies.registerDataAccess
        this.processStatusDataAccess = dependencies.processStatusDataAccess
    }

    async getReport(config: { flowDefinitionId: string, entityType: string, entityId: string }): Promise<any> {
        const { flowDefinitionId, entityType, entityId } = config
        //TODO: Keep definition id into syncContext
        const flowProcesses = await this.processStatusDataAccess.getAll({ definitionId: flowDefinitionId })
        const reportRegisters = []
        for (const flowProcess of flowProcesses) {
            //TODO: Filter by registerSourceId
            const registers = await this.registerDataAccess.getAll({ flowId: flowProcess.id, entityType: entityType })
            const reg = registers.filter(reg => reg.sourceEntityId === entityId)[0]
            reportRegisters.push(reg)
        }
        const orderedReportRegisters = reportRegisters.sort((a, b) => {
            if (a.date < b.date) {
                return 1
            }
            return -1
        })
        return orderedReportRegisters
    }
}
