export type Register = {
    id: string
    entityType: string
    sourceRelativeId: string | null
    sourceAbsoluteId: string | null
    sourceEntityId: string | null
    statusTag: RegisterStatusTag
    statusMeta: RegisterMeta
    entity: object | null,
    meta: RegisterMeta,
    date: Date,
    definitionId: string
    syncContext: SyncContext
}

export type RegisterMeta = string | object | null

export enum RegisterStatusTag {
    pending = "pending",
    success = "success",
    failed = "failed",
    invalid = "invalid",
    skipped = "skipped",
}

export type SyncContext = {
    flowId?: string,
    stepId?: string,
    adapterId?: string,
}