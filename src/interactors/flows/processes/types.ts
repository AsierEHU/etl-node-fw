import { SyncContext } from "../../../business/register"
import { StepRunOptions } from "../../steps/processes/types"
import { FlowDefinition } from "../definitions/types"

export interface Flow<fd extends FlowDefinition> {
    flowDefinition: fd
    run(syncContext: SyncContext, flowRunOptions?: FlowRunOptions): Promise<void> //start a flow from the beginning
    //continue(): Promise<void> //continue flow from the last success or partial success step.
}

export type FlowRunOptions = {
    stepsRunOptions?: { stepDefinitionId: string, runOptions: StepRunOptions }[]
    flowConfig?: any
}
