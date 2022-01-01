
import { AdapterRunOptions } from "../../adapters/processes/types";
import { InputEntity, RegisterStats, SyncContext } from "../../registers/types";

export interface Step<sd extends StepDefinition> {
    stepDefinition: sd
    run(syncContext: SyncContext, runOptions?: StepRunOptions): Promise<StepStatusSummary>
}

export interface StepDefinition {
    readonly id: string
    readonly definitionType: string
    readonly adapterDefinitionId: string
    readonly adapterRunOptions: AdapterRunOptions | null
}

export type StepStatusSummary = {
    registerStats: RegisterStats
    tryNumber: number,
    isInvalidRegistersSummary: boolean
}

export type StepRunOptions = {
    pushEntities?: InputEntity<any>[],
}