import { MetaEntity, RegisterStatusSummary, SyncContext } from "../registers/types"

export interface AdapterDefinition {
    readonly id: string
    readonly outputType: string
    readonly definitionType: string
    //     abstract readonly splitRecords: number
}

export interface Adapter<ad extends AdapterDefinition> {
    adapterDefinition: ad
    run(runOptions: AdapterRunOptions): Promise<void> //start, if registers -> filter input by ids, if skip -> compare hash to skip
}

export type AdapterRunOptions = { //filters, skips...
    // getEntitiesOptions?: any
    useMockedEntities?: boolean
    onlyFailedEntities?: boolean
    syncContext: SyncContext
}

export interface AdapterRunner {
    adapter: Adapter<AdapterDefinition>
    run(runOptions?: AdapterRunnerRunOptions): Promise<AdapterStatus> //start, if registers -> filter input by ids, if skip -> compare hash to skip
}

export type AdapterRunnerRunOptions = {
    mockEntities?: InputEntity<any>[],
    syncContext?: SyncContext,
    onlyFailedEntities?: boolean
}

export type InputEntity<e extends object> = MetaEntity | null | e

export type AdapterStatus = {
    id: string
    definitionId: string
    definitionType: string
    outputType: string
    statusTag: AdapterStatusTag //debugging
    statusMeta: AdapterMeta
    statusSummary: RegisterStatusSummary,
    runOptions: AdapterRunOptions | null
    syncContext: SyncContext
}

export type AdapterMeta = string | object | null


export enum AdapterStatusTag {
    pending = "pending", //pendiente de ejecución
    active = "active", //Ejecutandose
    success = "success", //sin erroes
    failed = "failed", //Software error or all records in (failed, invalid)
}

export interface AdapterDependencies<ad extends AdapterDefinition> {
    adapterDefinition: ad
}
