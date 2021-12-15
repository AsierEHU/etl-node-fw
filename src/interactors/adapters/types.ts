import { Entity, RegisterDataContext, RegisterMeta, RegisterStatusTag } from "../registers/types"

export interface AdapterDefinition {
    readonly id: string
    readonly outputType: string
    readonly definitionType: string
    //     abstract readonly splitRecords: number
    // version:string
    //     abstract readonly skipProcessedRecords: boolean
}

export interface Adapter<AdapterDefinition> {
    runOnce(runOptions?: AdapterRunOptions): Promise<AdapterStatusSummary> //start, if registers -> filter input by ids, if skip -> compare hash to skip
    getStatus(): Promise<AdapterStatus>
}

export type AdapterRunOptions = { //filters, skips...
    mockEntities?: InputEntity<Entity>[],
    onlyFailedEntities?: boolean
}

export type InputEntity<e extends Entity> = (EntityWithMeta<e> | null | e)

export type EntityWithMeta<e extends Entity> = {
    entity: e | null,
    meta: any,
}

export type AdapterStatus = {
    id: string
    definitionId: string
    definitionType: string
    outputType: string
    statusSummary: AdapterStatusSummary | null,
    runOptions: AdapterRunOptions | null
    syncContext: RegisterDataContext
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
    syncContext?: RegisterDataContext
}