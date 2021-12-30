import { SyncContext } from "../../registers/types"
import { FlowStatusSummary, Flow, FlowDefinition, FlowRunOptions } from "../processes/types"

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

export interface FlowRunner {
    flow: Flow<FlowDefinition>
    run(runOptions?: FlowRunOptions): Promise<FlowStatus> //start, if registers -> filter input by ids, if skip -> compare hash to skip
}