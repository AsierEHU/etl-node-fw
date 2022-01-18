import { StatusTag } from "../../../business/processStatus"
import { SyncContext } from "../../../business/register"
import { RegisterStats } from "../../registers/types"
import { AdapterDefinition } from "../definitions/types"
import { Adapter, AdapterRunOptions } from "../processes/types"

export interface AdapterRunner {
    adapter: Adapter<AdapterDefinition>
    run(syncContext: SyncContext, runOptions?: AdapterRunOptions): Promise<AdapterStatus>
}

export type AdapterStatus = {
    id: string
    definitionId: string
    definitionType: string
    outputType: string
    statusTag: StatusTag
    statusMeta: string | object | null
    timeStarted: Date | null
    timeFinished: Date | null
    statusSummary: RegisterStats | null,
    runOptions: AdapterRunOptions | null
    syncContext: SyncContext
}