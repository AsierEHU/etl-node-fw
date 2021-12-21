import { v4 as uuidv4 } from 'uuid';
import { RegisterInitValues, MetaEntity, Register, RegisterStatusTag, SyncContext } from "./types"

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

function isEntityWithMeta(entity?: any): entity is MetaEntity {
    return entity?.$entity != undefined
}

const getWithMetaFormat = (entities: any[]): MetaEntity[] => {
    return entities.map(entity => {
        if (isEntityWithMeta(entity)) {
            return entity
        }
        else {
            return {
                $entity: entity
            }
        }
    })
}

export const getWithInitFormat = (entities: any[], entityType?: string): RegisterInitValues[] => {
    const entitiesWithMeta = getWithMetaFormat(entities);
    return entitiesWithMeta.map(entityWithMeta => {
        return {
            entity: entityWithMeta.$entity,
            entityType,
            sourceEntityId: entityWithMeta.$id,
            meta: entityWithMeta.$meta,
        }
    })
}

export const initRegisters = (
    inputEntities: RegisterInitValues[], syncContext: SyncContext
): Register[] => {
    return inputEntities.map((entity) => {
        const inputEntityId = uuidv4();
        return {
            id: inputEntityId,
            entityType: entity.entityType || "inputMocked",
            sourceAbsoluteId: entity.sourceAbsoluteId || inputEntityId,
            sourceRelativeId: entity.sourceRelativeId || inputEntityId,
            sourceEntityId: entity.sourceEntityId || null,
            statusTag: entity.entityType ? RegisterStatusTag.pending : RegisterStatusTag.success,
            statusMeta: null,
            entity: entity.entity,
            meta: entity.meta || null,
            syncContext,
        }
    })
}

export const buildRegisterFromOthers = (registers: Register[], syncContext: SyncContext, entityType?: string) => {
    const entitiesInitialValues = registers.map(reg => {
        const initialValue: RegisterInitValues = {
            entity: reg.entity,
            meta: reg.meta,
            sourceAbsoluteId: reg.sourceAbsoluteId || undefined,
            sourceRelativeId: reg.id,
            sourceEntityId: reg.sourceEntityId || undefined,
            entityType
        }
        return initialValue
    })
    return initRegisters(entitiesInitialValues, syncContext)
}