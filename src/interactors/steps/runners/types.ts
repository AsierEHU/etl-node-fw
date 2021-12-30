import { AdapterRunnerRunOptions } from "../../adapters/runners/types"
import { SyncContext } from "../../registers/types"
import { StepStatusSummary, Step, StepDefinition } from "../processes/types"


export enum StepStatusTag {
    pending = "pending", //pendiente de ejecución
    active = "active", //Ejecutandose
    success = "success", //sin erroes
    failed = "failed", //Software error or all records in (failed, invalid)
}

export type StepStatus = {
    id: string
    definitionId: string
    definitionType: string
    statusTag: StepStatusTag //debugging
    statusMeta: StepMeta
    // exceptionTrace: object, //debugging
    syncContext: SyncContext
    statusSummary: StepStatusSummary
}

export type StepMeta = string | object | null

export interface StepRunner {
    step: Step<StepDefinition>
    run(runOptions?: AdapterRunnerRunOptions): Promise<StepStatus> 
}
