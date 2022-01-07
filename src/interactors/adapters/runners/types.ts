import { SyncContext, RegisterStats } from "../../registers/types"
import { Adapter, AdapterDefinition, AdapterRunOptions } from "../processes/types"

export interface AdapterRunner {
    adapter: Adapter<AdapterDefinition>
    run(syncContext: SyncContext, runOptions?: AdapterRunOptions): Promise<AdapterStatus>
}

export type AdapterStatus = {
    id: string
    definitionId: string
    definitionType: string
    outputType: string
    statusTag: AdapterStatusTag
    statusMeta: AdapterMeta
    timeStarted: Date | null
    timeFinished: Date | null
    statusSummary: RegisterStats | null,
    runOptions: AdapterRunOptions | null
    syncContext: SyncContext
}

export type AdapterMeta = string | object | null


export enum AdapterStatusTag {
    pending = "pending",
    active = "active",
    success = "success",
    failed = "failed",
}
