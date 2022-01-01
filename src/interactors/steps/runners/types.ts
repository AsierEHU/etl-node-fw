import { SyncContext } from "../../registers/types"
import { StepStatusSummary, Step, StepDefinition, StepRunOptions } from "../processes/types"


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
    statusTag: StepStatusTag
    statusMeta: StepMeta
    syncContext: SyncContext
    timeStarted: Date | null
    timeFinished: Date | null
    statusSummary: StepStatusSummary | null
}

export type StepMeta = string | object | null

export interface StepRunner {
    step: Step<StepDefinition>
    run(syncContext: SyncContext, runOptions?: StepRunOptions): Promise<StepStatus>
}
