import { uniqBy } from "lodash"
import { v4 as uuidv4 } from 'uuid';
import { EntityFetcher, EntityInitValues, EntityWithMeta, Register, RegisterDataAccess, RegisterDataFilter, RegisterStatusTag, SyncContext } from "./types"

export const isOrigin = (register: Register): boolean => {
    if (isByRowSource(register))
        return register.id == register.sourceAbsoluteId && register.id == register.sourceRelativeId
    else if (isByGroupSource(register))
        return register.sourceAbsoluteId == register.sourceRelativeId
    else
        throw Error("Unknown register origin type")
}

export function isByRowSource(register: Register): boolean {
    return register.sourceRelativeId != null && !register.sourceRelativeId.startsWith("00000000")
}

export function isByGroupSource(register: Register): boolean {
    return register.sourceRelativeId != null && register.sourceRelativeId.startsWith("00000000")
}

export function isEntityWithMeta(entity?: any): entity is EntityWithMeta {
    return entity?.entity != undefined
}

export const getWithMetaFormat = (entities: any[]): EntityWithMeta[] => {
    return entities.map(entity => {
        if (isEntityWithMeta(entity)) {
            return entity
        }
        else {
            return {
                entity,
                meta: null
            }
        }
    })
}

export const getWithInitFormat = (entities: any[], entityType: string): EntityInitValues[] => {
    const entitiesWithMeta = getWithMetaFormat(entities);
    return entitiesWithMeta.map(entityWithMeta => {
        return {
            ...entityWithMeta,
            entityType,
            sourceAbsoluteId: null,
            sourceRelativeId: null
        }
    })
}

export const initRegisters = (
    inputEntities: (EntityInitValues | EntityWithMeta | Object)[],
    syncContext: SyncContext
): Register[] => {
    return inputEntities.map((inputEntity) => {
        const entity: EntityInitValues = inputEntity as EntityInitValues
        const inputEntityId = uuidv4();
        return {
            id: inputEntityId,
            entityType: entity.entityType || "inputMocked",
            sourceAbsoluteId: entity.sourceAbsoluteId || inputEntityId,
            sourceRelativeId: entity.sourceRelativeId || inputEntityId,
            statusTag: entity.entityType ? RegisterStatusTag.pending : RegisterStatusTag.success,
            statusMeta: null,
            entity: entity.entity,
            meta: entity.meta,
            syncContext,
        }
    })
}

export const buildRegisterFromOthers = (registers: Register[], syncContext: SyncContext, entityType?: string) => {
    const entitiesInitialValues = registers.map(reg => {
        return {
            entity: reg.entity,
            meta: reg.meta,
            sourceAbsoluteId: reg.sourceAbsoluteId,
            sourceRelativeId: reg.id,
            entityType
        }
    })
    return initRegisters(entitiesInitialValues, syncContext)
}