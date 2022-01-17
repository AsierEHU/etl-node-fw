import { RegisterStats, SyncContext } from "../../registers/types"
import { StepDefinition } from "../definitions/types"
import { Step, StepRunOptions } from "../processes/types"


export enum StepStatusTag {
    pending = "pending",
    active = "active",
    success = "success",
    invalid = "invalid",
    failed = "failed",
}

export type StepStatus = {
    id: string
    definitionId: string
    definitionType: string
    statusTag: StepStatusTag
    statusMeta: StepMeta
    syncContext: SyncContext
    timeStarted: Date | null
    timeFinished: Date | null
    statusSummary: StepStatusSummary | null
}

export type StepMeta = string | object | null

export interface StepRunner {
    step: Step<StepDefinition>
    run(syncContext: SyncContext, runOptions?: StepRunOptions): Promise<StepStatus>
}

export type StepStatusSummary = {
    registerStats: RegisterStats
    retries: number,
}
