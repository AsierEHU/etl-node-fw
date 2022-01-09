import { v4 as uuidv4 } from 'uuid';
import { RegisterInitValues, MetaEntity, Register, RegisterStatusTag, SyncContext, reservedEntityTypes, registerSourceType, RegisterDataFilter, AdapterSpecialIds } from "./types"

export const isOrigin = (register: Register): boolean => {
    if (isByRowSource(register))
        return register.id == register.sourceAbsoluteId && register.id == register.sourceRelativeId
    else if (isBySetSource(register))
        return register.sourceAbsoluteId == register.sourceRelativeId
    else
        throw Error("Unknown register source type")
}

export function isByRowSource(register: Register): boolean {
    return isRowSourceType(register.sourceRelativeId)
}

export function isRowSourceType(sourceId: string | null): boolean {
    return sourceId != null && !sourceId.startsWith(registerSourceType.set)
}

export function isBySetSource(register: Register): boolean {
    return isSetSourceType(register.sourceRelativeId)
}

export function isSetSourceType(sourceId: string | null): boolean {
    return sourceId != null && sourceId.startsWith(registerSourceType.set)
}

function isEntityWithMeta(entity?: any): entity is MetaEntity {
    return entity?.$entity != undefined
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
        const initialStatus = syncContext.adapterId == AdapterSpecialIds.pushEntity || entity.entityType == reservedEntityTypes.flowConfig ?
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

export const buildRegisterFromOthers = (registers: Register[], syncContext: SyncContext) => {
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

export const generateSetSourceId = (setTypes: string[]): string => {
    const sourceId = setTypes.reduce((id, setType) => {
        return id + "-" + setType
    }, registerSourceType.set)

    return sourceId
}

export const getSetSourceIdTypes = (setSourceId: string): string[] => {
    const [set, ...types] = setSourceId.split("-")
    if (set != registerSourceType.set)
        throw Error("Not SET source type")
    return types
}