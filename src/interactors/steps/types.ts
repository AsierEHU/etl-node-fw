import { AdapterRunOptions } from "../adapters/types";
import { RegisterDataContext } from "../registers/types";

export interface Step<sd extends StepDefinition> {
    runOnce(stepRunOptions?: StepRunOptions): Promise<StepStatusTag> //start, if registers -> filter input by ids, if skip -> compare hash to skip
    getStatus(): Promise<StepStatus>
}

export type StepRunOptions = {
    adapterRunOptions?: AdapterRunOptions,
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
    statusMeta: any
    timeStarted: Date | null  //debugging
    timeFinished: Date | null   //debugging
    // exceptionTrace: object, //debugging
    runOptions: StepRunOptions | null
    syncContext: RegisterDataContext
    statusSummary: StepStatusSummary | null
}

export interface StepDependencies<sp extends StepDefinition> {
    stepDefinition: sp
    syncContext: RegisterDataContext
}

export type StepStatusSummary = { //Audit
    output_rows: number
    rows_success: number
    rows_failed: number
    rows_invalid: number
    rows_skipped: number
}