import { AdapterRunnerRunOptions } from "../../adapters/runners/types"
import { SyncContext } from "../../registers/types"
import { StepStatusSummary, Step, StepDefinition } from "../processes/types"


export enum StepStatusTag {
    pending = "pending", //pendiente de ejecución
    active = "active", //Ejecutandose
    success = "success", //sin erroes
    invalid = "invalid", // invalid business result
    failed = "failed", //Software error
}

export type StepStatus = {
    id: string
    definitionId: string
    definitionType: string
    statusTag: StepStatusTag //debugging
    statusMeta: StepMeta
    syncContext: SyncContext
    timeStarted: Date | null  //debugging
    timeFinished: Date | null   //debugging
    statusSummary: StepStatusSummary | null
}

export type StepMeta = string | object | null

export interface StepRunner {
    step: Step<StepDefinition>
    run(runOptions?: AdapterRunnerRunOptions): Promise<StepStatus>
}
