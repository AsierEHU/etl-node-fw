import { AdapterRunnerRunOptions } from "../../adapters/runners/types";
import { RegisterStats } from "../../registers/types";

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
    registerStats: RegisterStats
    tryNumber: number, //retries
    failedByDefinition: boolean
}