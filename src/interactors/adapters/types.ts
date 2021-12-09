export interface AdapterDefinition {
    readonly id: string
    readonly outputType: string
    readonly definitionType: string
    // version:string
}

export interface Adapter<AdapterDefinition> {
    start(runOptions?: AdapterRunOptions): Promise<AdapterStatusTag> //start, if registers -> filter input by ids, if skip -> compare hash to skip
    getStatus(): Promise<AdapterStatus>
}

export type AdapterRunOptions = {
    mockEntities?: InputEntity<any>[],
    getOptions?: any //filters, skips...
}

export type InputEntity<input extends object> = {
    entity: input,
    meta: any,
}


export type AdapterStatus = {
    id: string
    outputType: string
    // stepStatusId: string
    // flowStatusId: string
    statusTag: AdapterStatusTag
    summary: AdapterStatusSummary | null,
    meta: any //save here for example every info need for final step (Alerts, csv name...)
}

export type AdapterStatusSummary = { //Audit
    output_rows: number
    rows_success: number
    rows_failed: number
    rows_invalid: number
    rows_skipped: number
}

export enum AdapterStatusTag {
    notProcessed = "notProcessed", //not processed yet
    success = "success", //all records success
    successPartial = "successPartial", //records exitos y records in (failed, invalid)
    skipped = "skipped", //all records skipped
    failed = "failed", //Software error or all records in failed
    invalid = "invalid" //all records invalid
}

