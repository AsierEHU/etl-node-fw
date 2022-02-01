import { Register, RegisterStatusTag } from "../../business/register"

export interface RegisterDataAccess {
    save: (register: Register) => Promise<void>
    saveAll: (registers: Register[]) => Promise<void>
    get: (id: string) => Promise<Register | null>
    getAll: (filter?: RegisterDataFilter) => Promise<Register[]>
    removeAll: (filter?: RegisterDataFilter) => Promise<void>
}

export type RegisterDataFilter = {
    flowId?: string,
    stepId?: string,
    adapterId?: string,
    entityType?: string,
    registerStatus?: RegisterStatusTag,
    registersIds?: string[],
    excludeOptions?: {
        excludeReservedEntityTypes?: boolean,
        excludeEntityPayload?: boolean,
    }
}

export type MetaEntity = {
    $entity: object | null,
    $meta?: any,
    $id?: string
}
export interface EntityFetcher {
    getMetaEntities: (filter?: RegisterDataFilter) => Promise<MetaEntity[]>
    getFlowConfig: () => Promise<any>
}

export type RegisterInitValues = {
    entity: object | null,
    entityType: string,
    definitionId: string,
    meta?: any,
    sourceAbsoluteId?: string,
    sourceRelativeId?: string,
    sourceEntityId?: string,
}

export type RegisterStats = {
    registers_total: number
    registers_success: number
    registers_failed: number
    registers_invalid: number
    registers_skipped: number
}

export type InputEntity<e extends object> = MetaEntity | null | e
