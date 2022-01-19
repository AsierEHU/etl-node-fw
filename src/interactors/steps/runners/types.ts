import { StatusTag } from "../../../business/processStatus"
import { SyncContext } from "../../../business/register"
import { RegisterStats } from "../../registers/types"
import { StepDefinition } from "../definitions/types"
import { Step, StepRunOptions } from "../processes/types"


export enum StepStatusTag {
    pending = "pending",
    active = "active",
    success = "success",
    invalid = "invalid",
    failed = "failed",
}

export type StepPresenter = {
    id: string
    definitionId: string
    definitionType: string
    statusTag: StatusTag
    statusMeta: string | object | null
    syncContext: SyncContext
    timeStarted: Date | null
    timeFinished: Date | null
    statusSummary: StepStatusSummary | null
}


export interface StepRunner {
    step: Step<StepDefinition>
    run(syncContext: SyncContext, runOptions?: StepRunOptions): Promise<StepPresenter>
}

export type StepStatusSummary = {
    registerStats: RegisterStats
    retries: number,
}
