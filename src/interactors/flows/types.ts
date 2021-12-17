import { StepRunOptions } from "../steps/types"

export enum FlowStatusTag {
    pending = "pending", //pendiente de ejecución
    active = "active", //Ejecutandose
    success = "success", //sin erroes
    error = "error", //SW error
}

export type FlowStatus = {
    id: string
    definitionId: string
    statusTag: FlowStatusTag  //debugging
    statusMeta: FlowMeta
    timeStarted: Date,  //debugging
    timeFinished: Date,  //debugging
    // exceptionTrace: object, //debugging
    meta: FlowMeta
}

export type FlowMeta = string | object | null

export interface Flow<fd extends FlowDefinition> {
    runOnce(flowRunOptions?: FlowRunOptions): Promise<FlowStatusTag> //start a flow from the beginning
    continue(): Promise<void> //continue flow from the last success or partial success step.
    getStatus(): Promise<FlowStatus>
}

export type FlowRunOptions = {
    stepsRunOptions: { stepDefinitionId: string, stepRunOptions: StepRunOptions }[]
}


export interface FlowDefinition {
    id: string
    // name: string
    // version: string
    // description: string
}
