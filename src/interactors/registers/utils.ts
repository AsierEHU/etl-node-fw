import { v4 as uuidv4 } from 'uuid';
import { Register, SyncContext, RegisterStatusTag } from '../../business/register';
import { RegisterInitValues, MetaEntity, ReservedEntityTypes, registerSourceType, AdapterSpecialIds } from "./types"

export const isOrigin = (register: Register): boolean => {
    if (register.entityType === ReservedEntityTypes.setRegister) {
        return false
    } else {
        return register.id === register.sourceAbsoluteId && register.id === register.sourceRelativeId
    }
}

function isEntityWithMeta(entity?: any): entity is MetaEntity {
    return entity?.$entity !== undefined
}

export const getWithMetaFormat = (entities: any[]): MetaEntity[] => {
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

export const getWithInitFormat = (entities: any[], entityType: string, definitionId: string): RegisterInitValues[] => {
    const entitiesWithMeta = getWithMetaFormat(entities);
    return entitiesWithMeta.map(entityWithMeta => {
        return {
            entity: entityWithMeta.$entity,
            entityType,
            sourceEntityId: entityWithMeta.$id,
            meta: entityWithMeta.$meta,
            definitionId
        }
    })
}

export const initRegisters = (
    inputEntities: RegisterInitValues[], syncContext: SyncContext
): Register[] => {
    return inputEntities.map((entity) => {
        const inputEntityId = uuidv4();
        const initialStatus = syncContext.adapterId == AdapterSpecialIds.pushEntity || entity.entityType == ReservedEntityTypes.flowConfig ?
            RegisterStatusTag.success : RegisterStatusTag.pending
        return {
            id: inputEntityId,
            entityType: entity.entityType,
            sourceAbsoluteId: entity.sourceAbsoluteId || inputEntityId,
            sourceRelativeId: entity.sourceRelativeId || inputEntityId,
            sourceEntityId: entity.sourceEntityId || null,
            statusTag: initialStatus,
            statusMeta: null,
            entity: entity.entity,
            meta: entity.meta || null,
            date: new Date(),
            definitionId: entity.definitionId,
            syncContext,

        }
    })
}

export const buildChildRegisters = (registers: Register[], syncContext: SyncContext) => {
    const entitiesInitialValues = registers.map(reg => {
        const initialValue: RegisterInitValues = {
            entity: reg.entity,
            meta: reg.meta,
            sourceAbsoluteId: reg.sourceAbsoluteId || undefined,
            sourceRelativeId: reg.id,
            sourceEntityId: reg.sourceEntityId || undefined,
            entityType: reg.entityType,
            definitionId: reg.definitionId
        }
        return initialValue
    })
    return initRegisters(entitiesInitialValues, syncContext)
}

export const buildSetRegister = (inputRegistersIds: string[], syncContext: SyncContext, definitionId: string): Register => {
    const id = uuidv4()
    return {
        id,
        entityType: ReservedEntityTypes.setRegister,
        sourceAbsoluteId: id,
        sourceRelativeId: id,
        sourceEntityId: null,
        statusTag: RegisterStatusTag.success,
        statusMeta: null,
        entity: inputRegistersIds,
        meta: null,
        date: new Date(),
        definitionId,
        syncContext,
    }
}