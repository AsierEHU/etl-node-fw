export type Register<e extends Entity> = {
    id: string //datalineage, unique
    entityType: string
    sourceRelativeId: string | null //datalineage
    sourceAbsoluteId: string | null //datalineage
    statusTag: RegisterStatusTag  //managing bad data
    statusMeta: RegisterMeta
    entity: e | null, //register itself
    meta: RegisterMeta, //save here for example every info need for final step (Alerts, csv name...)
    syncContext: RegisterDataContext
}

export type RegisterMeta = string | object | null

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

export type Entity = object