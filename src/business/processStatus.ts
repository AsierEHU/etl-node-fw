import { SyncContext } from "./register"

export type ProcessStatus = {
    id: string
    definitionId: string
    statusTag: StatusTag
    statusMeta: string | object | null
    timeStarted: Date | null
    timeFinished: Date | null
    runOptions: any
    syncContext: SyncContext
    processType: ProcessType
}

export enum StatusTag {
    pending = "pending",
    active = "active",
    success = "success",
    invalid = "invalid",
    failed = "failed",
}

export enum ProcessType {
    adapter = "adapter",
    step = "step",
    flow = "flow"
}