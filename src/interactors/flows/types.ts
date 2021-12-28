import { AdapterRunnerRunOptions } from "../adapters/types"
import { SyncContext } from "../registers/types"

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


export enum FlowStatusTag {
    pending = "pending", //pendiente de ejecución
    active = "active", //Ejecutandose
    success = "success", //sin erroes
    failed = "failed", //SW error
}

export type FlowStatus = {
    id: string
    definitionId: string
    definitionType: string
    statusTag: FlowStatusTag  //debugging
    statusMeta: FlowMeta
    statusSummary: FlowStatusSummary
    syncContext: SyncContext
}

export type FlowMeta = string | object | null

export type FlowStatusSummary = { //Audit
    timeStarted: Date | null  //debugging
    timeFinished: Date | null   //debugging
    stepsSuccess: number
    stepsTotal: number
    stepFailedId: string | null
}

export interface FlowRunner {
    flow: Flow<FlowDefinition>
    run(runOptions?: FlowRunOptions): Promise<FlowStatus> //start, if registers -> filter input by ids, if skip -> compare hash to skip
}