import { SyncContext } from "../../registers/types"
import { FlowStatusSummary, Flow, FlowDefinition, FlowRunOptions } from "../processes/types"

export enum FlowStatusTag {
    pending = "pending",
    active = "active",
    success = "success",
    failed = "failed",
}

export type FlowStatus = {
    id: string
    definitionId: string
    definitionType: string
    statusTag: FlowStatusTag
    statusMeta: FlowMeta
    timeStarted: Date | null
    timeFinished: Date | null
    statusSummary: FlowStatusSummary | null
    syncContext: SyncContext
}

export type FlowMeta = string | object | null

export interface FlowRunner {
    flow: Flow<FlowDefinition>
    run(runOptions?: FlowRunOptions): Promise<FlowStatus>
}
