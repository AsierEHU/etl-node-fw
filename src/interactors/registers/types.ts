export type Register = {
    id: string //datalineage, unique
    entityType: string
    sourceRelativeId: string | null //datalineage
    sourceAbsoluteId: string | null //datalineage
    sourceEntityId: string | null //datalineage
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
    adapterId?: string,
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
    adapterId?: string,
    registerType?: string,
    registerStatus?: RegisterStatusTag
}

export type MetaEntity = {
    $entity: object | null,
    $meta?: any,
    $id?: string
}
export interface EntityFetcher {//For a specific syncContext
    getEntities: (filter?: RegisterDataFilter) => Promise<MetaEntity[]>
    getExtractorConfigEntity: () => Promise<any>
}

export type RegisterInitValues = {
    entity: object | null,
    entityType: string,
    meta?: any,
    sourceAbsoluteId?: string,
    sourceRelativeId?: string,
    sourceEntityId?: string,
}

export type RegisterStats = { //Audit
    registers_total: number
    registers_success: number
    registers_failed: number
    registers_invalid: number
    registers_skipped: number
}

export type InputEntity<e extends object> = MetaEntity | null | e

export enum reservedRegisterEntityTypes {
    entityPushed = "$entityPushed",
    extractorConfig = "$extractorConfig"
}

export enum registerSourceType {
    row = "row",
    set = "set"
}