import { SyncContext } from "./register"

export type ProcessStatus = {
    id: string
    definitionId: string
    statusTag: StatusTag
    statusMeta: string | object | null
    timeStarted: Date | null
    timeFinished: Date | null
    runOptions: object | null
    syncContext: SyncContext
}

export enum StatusTag {
    pending = "pending",
    active = "active",
    success = "success",
    invalid = "invalid",
    failed = "failed",
}