export type Register<entity extends Entity> = {
    id: string //datalineage, unique
    entityType: string
    source_id: string | null //datalineage, [relative or absoulte]
    statusTag: RegisterStatusTag  //managing bad data
    statusMeta: any
    entity: entity | null, //register itself
    meta: any, //save here for example every info need for final step (Alerts, csv name...)
    context: RegisterDataContext
    // hash:string,
}

export enum RegisterStatusTag {
    pending = "pending",
    success = "success", //SW - Business
    failed = "failed",  //SW - Business
    invalid = "invalid", //Business
    skipped = "skipped", //Business
}

export interface RegisterDataAccess<entity extends Entity> {//For a specific context
    save: (register: Register<entity>) => Promise<void>
    saveAll: (registers: Register<entity>[]) => Promise<void>
    get: (id: string) => Promise<Register<entity> | null>
    getAll: (filter?: RegisterDataFilter, registersIds?: string[]) => Promise<Register<entity>[]>
}

export type RegisterDataContext = {
    flowId?: string,
    stepId?: string,
    apdaterId?: string,
}

export type RegisterDataFilter = {
    flowId?: string,
    stepId?: string,
    apdaterId?: string,
    registerType?: string,
    registerStatus?: RegisterStatusTag
}

export interface Entity {
}