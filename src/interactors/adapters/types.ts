import { Entity, Register, RegisterStatusTag, SyncContext } from "../registers/types"

export interface AdapterDefinition {
    readonly id: string
    readonly outputType: string
    readonly definitionType: string
    //     abstract readonly splitRecords: number
}

export interface Adapter<AdapterDefinition> {
    runOnce(runOptions?: AdapterRunOptions): Promise<AdapterStatusTag> //start, if registers -> filter input by ids, if skip -> compare hash to skip
    getStatus(): Promise<AdapterStatus>
}

export type AdapterRunOptions = { //filters, skips...
    inputEntities?: InputEntity<Entity>[],
    onlyFailedEntities?: boolean
}

export type InputEntity<e extends Entity> = EntityWithMeta<e> | null | e

export type EntityWithMeta<e extends Entity> = {
    entity: e | null,
    meta: any,
}

export type AdapterStatus = {
    id: string
    definitionId: string
    definitionType: string
    outputType: string
    statusTag: AdapterStatusTag //debugging
    statusMeta: AdapterMeta
    statusSummary: AdapterStatusSummary | null,
    runOptions: AdapterRunOptions | null
    syncContext: SyncContext
}

export type AdapterMeta = string | object | null


export enum AdapterStatusTag {
    pending = "pending", //pendiente de ejecución
    active = "active", //Ejecutandose
    success = "success", //sin erroes
    failed = "failed", //Software error or all records in (failed, invalid)
}


export type AdapterStatusSummary = { //Audit
    output_rows: number
    rows_success: number
    rows_failed: number
    rows_invalid: number
    rows_skipped: number
}

export interface AdapterDependencies<ad extends AdapterDefinition> {
    adapterDefinition: ad
    syncContext?: SyncContext
}

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