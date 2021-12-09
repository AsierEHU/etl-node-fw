export type Register<entity extends object> = {
    id: string //datalineage, unique
    entityType: string
    source_id: string | null //datalineage, [relative or absoulte]
    statusTag: RegisterStatusTag | null  //managing bad data
    statusMeta: any
    entity: entity, //register itself
    meta: any, //save here for example every info need for final step (Alerts, csv name...)
    // hash:string,
}

export enum RegisterStatusTag {
    success = "success", //SW - Business
    failed = "failed",  //SW - Business
    invalid = "invalid", //Business
    skipped = "skipped", //Business
}

export interface RegisterDataAccess<entity extends object> {//For a specific context
    save: (register: Register<entity>, context: RegisterDataContext) => Promise<void>
    saveAll: (registers: Register<entity>[], context: RegisterDataContext) => Promise<void>
    get: (id: string) => Promise<Register<entity> | null>
    getAll: (filter?: RegisterDataFilter) => Promise<Register<entity>[]>
}

export type RegisterDataContext = {
    flowId?: string,
    stepId?: string,
    apdaterId?: string,
}

export type RegisterDataFilter = {
    registerType?: string,
    flowId?: string,
    stepId?: string,
    apdaterId?: string,
    registerStatus?: RegisterStatusTag
}