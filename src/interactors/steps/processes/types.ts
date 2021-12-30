import { AdapterRunnerRunOptions } from "../../adapters/runners/types";
import { RegisterStatusSummary } from "../../registers/types";

export interface Step<sd extends StepDefinition> {
    stepDefinition: sd
    run(runOptions: AdapterRunnerRunOptions): Promise<StepStatusSummary>
}

export interface StepDefinition {
    readonly id: string
    readonly definitionType: string
    readonly adapterDefinitionId: string
    readonly adapterDefinitionRunOptions: AdapterRunnerRunOptions | null
}

export type StepStatusSummary = { //Audit
    registerStatusSummary: RegisterStatusSummary
    tryNumber: number, //retries
    timeStarted: Date | null  //debugging
    timeFinished: Date | null   //debugging
    failedByDefinition: boolean
}