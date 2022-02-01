export type Register = {
    id: string
    entityType: string | ReservedEntityTypes
    sourceRelativeId: string | null
    sourceAbsoluteId: string | null
    sourceEntityId: string | null
    statusTag: RegisterStatusTag
    statusMeta: string | object | null
    entity: object | null
    meta: string | object | null
    date: Date,
    definitionId: string
    syncContext: SyncContext
}

export enum ReservedEntityTypes {
    flowConfig = "$flowConfig",
    setRegister = "$setRegister"
}

export enum registerSourceType {
    row = "row",
    set = "set"
}

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
    adapterId?: string | AdapterSpecialIds,
}

export enum AdapterSpecialIds {
    pushEntity = "$pushEntity"
}
