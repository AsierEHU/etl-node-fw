import { ProcessStatus } from "../../business/processStatus";

export interface ProcessStatusDataAccess {
    save: (status: ProcessStatus) => Promise<void>
    get: (id: string) => Promise<ProcessStatus | null>
    getAll: (filter?: ProcessStatusDataFilter) => Promise<ProcessStatus[]>
}

export type ProcessStatusDataFilter = {
    flowId?: string,
    stepId?: string,
    adapterId?: string,
    definitionId?: string
}