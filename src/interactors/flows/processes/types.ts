import { AdapterRunnerRunOptions } from "../../adapters/runners/types"
import { SyncContext } from "../../registers/types"

export interface Flow<fd extends FlowDefinition> {
    flowDefinition: fd
    run(flowRunOptions: FlowRunOptions): Promise<FlowStatusSummary> //start a flow from the beginning
    //continue(): Promise<void> //continue flow from the last success or partial success step.
}

export interface FlowDefinition {
    id: string
    readonly definitionType: string
}

export type FlowRunOptions = {
    syncContext?: SyncContext
    stepsRunOptions?: { stepDefinitionId: string, runOptions: AdapterRunnerRunOptions }[]
}

export type FlowStatusSummary = { //Audit
    stepsSuccess: number
    stepsTotal: number
    stepFailedId: string | null
}