import { SyncContext, RegisterStats } from "../../registers/types"
import { InputEntity } from "../processes/localAdapter/types"
import { Adapter, AdapterDefinition, AdapterRunOptions } from "../processes/types"

export interface AdapterRunner {
    adapter: Adapter<AdapterDefinition>
    run(runOptions?: AdapterRunnerRunOptions): Promise<AdapterStatus>
}

export type AdapterRunnerRunOptions = {
    pushEntities?: InputEntity<any>[],
    syncContext?: SyncContext,
    onlyFailedEntities?: boolean
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
    pending = "pending", //pendiente de ejecución
    active = "active", //Ejecutandose
    success = "success", //sin erroes
    failed = "failed", //Software error
}
