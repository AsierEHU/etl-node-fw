import { SyncContext } from "../../registers/types";

export interface AdapterDefinition {
    readonly id: string
    readonly outputType: string
    readonly definitionType: string
    //     abstract readonly splitRecords: number
}

export interface Adapter<ad extends AdapterDefinition> {
    readonly adapterDefinition: ad
    run(runOptions: AdapterRunOptions): Promise<void>
}

export type AdapterRunOptions = {
    // getEntitiesOptions?: any
    useMockedEntities?: boolean
    onlyFailedEntities?: boolean
    syncContext: SyncContext
}