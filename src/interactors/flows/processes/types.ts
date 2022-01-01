import { SyncContext } from "../../registers/types"
import { StepRunOptions } from "../../steps/processes/types"

export interface Flow<fd extends FlowDefinition> {
    flowDefinition: fd
    run(syncContext: SyncContext, flowRunOptions?: FlowRunOptions): Promise<FlowStatusSummary> //start a flow from the beginning
    //continue(): Promise<void> //continue flow from the last success or partial success step.
}

export interface FlowDefinition {
    id: string
    readonly definitionType: string
}

export type FlowRunOptions = {
    stepsRunOptions?: { stepDefinitionId: string, runOptions: StepRunOptions }[]
    flowPushConfig?: any
}

export type FlowStatusSummary = {
    stepsSuccess: number,
    stepsTotal: number,
    stepsFailed: number,
    stepsInvalid: number,
    stepsPending: number,
}