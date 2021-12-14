export type Register<entity extends Entity> = {
    id: string //datalineage, unique
    entityType: string
    sourceRelativeId: string | null //datalineage
    sourceAbsoluteId: string | null //datalineage
    statusTag: RegisterStatusTag  //managing bad data
    statusMeta: any
    entity: entity | null, //register itself
    meta: any, //save here for example every info need for final step (Alerts, csv name...)
    syncContext: RegisterDataContext
    // hash:string,
}

export enum RegisterStatusTag {
    pending = "pending",
    success = "success", //SW - Business
    failed = "failed",  //SW - Business
    invalid = "invalid", //Business
    skipped = "skipped", //Business
}

export type RegisterDataContext = {
    flowId?: string,
    stepId?: string,
    apdaterId?: string,
}

export interface Entity {
}