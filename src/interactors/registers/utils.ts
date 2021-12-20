import { uniqBy } from "lodash"
import { v4 as uuidv4 } from 'uuid';
import { Entity, EntityFetcher, EntityInitValues, EntityWithMeta, Register, RegisterDataAccess, RegisterDataFilter, RegisterStatusTag, SyncContext } from "./types"

export const isOrigin = (register: Register<Entity>): boolean => {
    if (isByRowSource(register))
        return register.id == register.sourceAbsoluteId && register.id == register.sourceRelativeId
    else if (isByGroupSource(register))
        return register.sourceAbsoluteId == register.sourceRelativeId
    else
        throw Error("Unknown register origin type")
}

export function isByRowSource(register: Register<Entity>): boolean {
    return register.sourceRelativeId != null && !register.sourceRelativeId.startsWith("00000000")
}

export function isByGroupSource(register: Register<Entity>): boolean {
    return register.sourceRelativeId != null && register.sourceRelativeId.startsWith("00000000")
}

export function isEntityWithMeta(entity?: any): entity is EntityWithMeta<Entity> {
    return entity?.entity != undefined
}

export const getWithMetaFormat = (entities: any[]): EntityWithMeta<Entity>[] => {
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

export const getWithInitFormat = (entities: any[], entityType: string): EntityInitValues<Entity>[] => {
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
    inputEntities: (EntityInitValues<Entity> | EntityWithMeta<Entity> | Entity)[],
    syncContext: SyncContext
): Register<Entity>[] => {
    return inputEntities.map((inputEntity) => {
        const entity: EntityInitValues<Entity> = inputEntity as EntityInitValues<Entity>
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