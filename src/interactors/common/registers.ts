import { uniqBy } from "lodash"
import { Register, RegisterStatusTag, ReservedEntityTypes } from "../../business/register"

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
