import { Entity } from "../registers/types"

export interface AdapterDefinition {
    readonly id: string
    readonly outputType: string
    readonly definitionType: string
    //     abstract readonly splitRecords: number
    // version:string
    //     abstract readonly skipProcessedRecords: boolean
}

export interface Adapter<AdapterDefinition> {
    start(runOptions?: AdapterRunOptions): Promise<AdapterStatusSummary> //start, if registers -> filter input by ids, if skip -> compare hash to skip
    getStatus(): Promise<AdapterStatus>
}

export type AdapterRunOptions = {
    mockEntities?: (EntityWithMeta<Entity> | null | Entity)[],
    getOptions?: any //filters, skips...
}

export type EntityWithMeta<input extends Entity> = {
    entity: input,
    meta: any,
}


export type AdapterStatus = {
    id: string
    definitionId: string
    definitionType: string
    outputType: string
    // stepStatusId: string
    // flowStatusId: string
    statusSummary: AdapterStatusSummary | null,
    meta: any //save here for example every info need for final step (Alerts, csv name...)
}

export type AdapterStatusSummary = { //Audit
    output_rows: number
    rows_success: number
    rows_failed: number
    rows_invalid: number
    rows_skipped: number
}
