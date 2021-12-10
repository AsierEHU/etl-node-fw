import { AdapterDefinition, AdapterRunOptions } from "../adapters/types";
import { RegisterDataContext } from "../registers/types";

export interface Step<sd extends StepDefinition> {
    start(stepRunOptions?: StepRunOptions): Promise<StepStatusTag> //start, if registers -> filter input by ids, if skip -> compare hash to skip
    getStatus(): Promise<StepStatus>
}

export type StepRunOptions = {
    adapterRunOptions?: AdapterRunOptions,
}

export interface StepDefinition {
    readonly id: string
    readonly definitionType: string
    // version:string
    readonly adapterDefinition: AdapterDefinition
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
    meta: any
    syncContext: RegisterDataContext
}

export interface StepDependencies<sp extends StepDefinition> {
    stepDefinition: sp
    syncContext: RegisterDataContext
}