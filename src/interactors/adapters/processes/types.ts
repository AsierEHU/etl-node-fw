import { SyncContext } from "../../registers/types";

export interface AdapterDefinition {
    readonly id: string
    readonly outputType: string
    readonly definitionType: string
}

export interface Adapter<ad extends AdapterDefinition> {
    readonly adapterDefinition: ad
    run(syncContext: SyncContext, runOptions?: AdapterRunOptions): Promise<void>
}

export type AdapterRunOptions = {
    usePushedEntityTypes?: string[]
    onlyFailedEntities?: boolean
}