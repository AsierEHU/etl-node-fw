
import { InputEntity, RegisterStats, SyncContext } from "../../registers/types";
import { StepDefinition } from "../definitions/types";

export interface Step<sd extends StepDefinition> {
    stepDefinition: sd
    run(syncContext: SyncContext, runOptions?: StepRunOptions): Promise<StepStatusSummary>
}

export type StepStatusSummary = {
    registerStats: RegisterStats
    retries: number,
    isInvalidRegistersSummary: boolean
}

export type StepRunOptions = {
    pushEntities?: { [type: string]: InputEntity<any>[] },
}