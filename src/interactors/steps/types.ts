import { AdapterRunOptions, InputEntity } from "../adapters/types";
import { Entity, SyncContext } from "../registers/types";

export interface Step<sd extends StepDefinition> {
    run(stepRunOptions?: StepRunOptions): Promise<StepStatusTag> //start, if registers -> filter input by ids, if skip -> compare hash to skip
    getStatus(): Promise<StepStatus>
}

export type StepRunOptions = {
    inputEntities?: InputEntity<Entity>[],
}

export interface StepDefinition {
    readonly id: string
    readonly definitionType: string
    // version:string
    readonly adapterDefinitionId: string
    // stepClass:string
    //name or description
}

export enum StepStatusTag {
    pending = "pending", //pendiente de ejecución
    active = "active", //Ejecutandose
    success = "success", //sin erroes
    failed = "failed", //Software error or all records in (failed, invalid)
}

export type StepStatus = {
    id: string
    definitionId: string
    definitionType: string
    tryNumber: number //retries
    statusTag: StepStatusTag //debugging
    statusMeta: StepMeta
    timeStarted: Date | null  //debugging
    timeFinished: Date | null   //debugging
    // exceptionTrace: object, //debugging
    runOptions: StepRunOptions | null
    syncContext: SyncContext
    statusSummary: StepStatusSummary | null
}

export type StepMeta = string | object | null

export interface StepDependencies<sp extends StepDefinition> {
    stepDefinition: sp
    syncContext: SyncContext
}

export type StepStatusSummary = { //Audit
    output_rows: number
    rows_success: number
    rows_failed: number
    rows_invalid: number
    rows_skipped: number
}