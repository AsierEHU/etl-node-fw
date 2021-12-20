export type Register = {
    id: string //datalineage, unique
    entityType: string
    sourceRelativeId: string | null //datalineage
    sourceAbsoluteId: string | null //datalineage
    statusTag: RegisterStatusTag  //managing bad data
    statusMeta: RegisterMeta
    entity: object | null, //register itself
    meta: RegisterMeta, //save here for example every info need for final step (Alerts, csv name...)
    syncContext: SyncContext
}

export type RegisterMeta = string | object | null

export enum RegisterStatusTag {
    pending = "pending",
    success = "success", //SW - Business
    failed = "failed",  //SW - Business
    invalid = "invalid", //Business
    skipped = "skipped", //Business
}

export type SyncContext = {
    flowId?: string,
    stepId?: string,
    apdaterId?: string,
}
export interface RegisterDataAccess {//For a specific syncContext
    save: (register: Register) => Promise<void>
    saveAll: (registers: Register[]) => Promise<void>
    get: (id: string) => Promise<Register | null>
    getAll: (filter?: RegisterDataFilter, registersIds?: string[]) => Promise<Register[]>
}

export type RegisterDataFilter = {
    flowId?: string,
    stepId?: string,
    apdaterId?: string,
    registerType?: string,
    registerStatus?: RegisterStatusTag
}

export type EntityWithMeta = {
    entity: object | null,
    meta: any,
}
export interface EntityFetcher {//For a specific syncContext
    getEntities: (filter?: RegisterDataFilter) => Promise<EntityWithMeta[]>
}

export type EntityInitValues = {
    entity: object | null,
    entityType: any,
    meta: any,
    sourceAbsoluteId: any,
    sourceRelativeId: any,
}
