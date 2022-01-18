
import { SyncContext } from "../../../business/register";
import { AdapterDefinition } from "../definitions/types";

export interface Adapter<ad extends AdapterDefinition> {
    readonly adapterDefinition: ad
    run(syncContext: SyncContext, runOptions?: AdapterRunOptions): Promise<void>
}

export type AdapterRunOptions = {
    usePushedEntityTypes?: string[]
    onlyFailedEntities?: boolean
}