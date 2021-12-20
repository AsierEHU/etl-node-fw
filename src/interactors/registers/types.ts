export type Register<e extends Entity> = {
    id: string //datalineage, unique
    entityType: string
    sourceRelativeId: string | null //datalineage
    sourceAbsoluteId: string | null //datalineage
    statusTag: RegisterStatusTag  //managing bad data
    statusMeta: RegisterMeta
    entity: e | null, //register itself
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

export type Entity = object

export interface RegisterDataAccess {//For a specific syncContext
    save: (register: Register<Entity>) => Promise<void>
    saveAll: (registers: Register<Entity>[]) => Promise<void>
    get: (id: string) => Promise<Register<Entity> | null>
    getAll: (filter?: RegisterDataFilter, registersIds?: string[]) => Promise<Register<Entity>[]>
}

export type RegisterDataFilter = {
    flowId?: string,
    stepId?: string,
    apdaterId?: string,
    registerType?: string,
    registerStatus?: RegisterStatusTag
}

export type EntityWithMeta<e extends Entity> = {
    entity: e | null,
    meta: any,
}
export interface EntityFetcher {//For a specific syncContext
    getEntities: (filter?: RegisterDataFilter) => Promise<EntityWithMeta<Entity>[]>
}

export type EntityInitValues<e extends Entity> = {
    entity: e | null,
    entityType: any,
    meta: any,
    sourceAbsoluteId: any,
    sourceRelativeId: any,
}
