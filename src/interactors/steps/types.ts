import { AdapterRunnerRunOptions, InputEntity } from "../adapters/types";
import { RegisterStatusSummary, SyncContext } from "../registers/types";

export interface Step<sd extends StepDefinition> {
    stepDefinition: sd
    run(runOptions: AdapterRunnerRunOptions): Promise<StepStatusSummary> //start, if registers -> filter input by ids, if skip -> compare hash to skip
}

export interface StepDefinition {
    readonly id: string
    readonly definitionType: string
    readonly adapterDefinitionId: string
    readonly adapterDefinitionRunOptions: AdapterRunnerRunOptions | null
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
    statusTag: StepStatusTag //debugging
    statusMeta: StepMeta
    // exceptionTrace: object, //debugging
    syncContext: SyncContext
    statusSummary: StepStatusSummary
}

export type StepMeta = string | object | null

export interface StepDependencies<sp extends StepDefinition> {
    stepDefinition: sp
    syncContext: SyncContext
}

export type StepStatusSummary = { //Audit
    registerStatusSummary: RegisterStatusSummary
    tryNumber: number, //retries
    timeStarted: Date | null  //debugging
    timeFinished: Date | null   //debugging
    failedStatusSummary: boolean
}

export interface StepRunner {
    step: Step<StepDefinition>
    run(runOptions?: AdapterRunnerRunOptions): Promise<StepStatus> //start, if registers -> filter input by ids, if skip -> compare hash to skip
}
