
import { StatusTag } from "../../../business/processStatus"
import { SyncContext } from "../../../business/register"
import { FlowDefinition } from "../definitions/types"
import { Flow, FlowRunOptions } from "../processes/types"

export enum FlowStatusTag {
    pending = "pending",
    active = "active",
    success = "success",
    failed = "failed",
}

export type FlowPresenter = {
    id: string
    definitionId: string
    definitionType: string
    statusTag: StatusTag
    statusMeta: string | object | null
    timeStarted: Date | null
    timeFinished: Date | null
    statusSummary: FlowStatusSummary | null
    syncContext: SyncContext
}

export type FlowStatusSummary = {
    stepsSuccess: number,
    stepsFailed: number,
    stepsInvalid: number,
}

export interface FlowRunner {
    flow: Flow<FlowDefinition>
    run(runOptions?: FlowRunOptions): Promise<FlowPresenter>
}
