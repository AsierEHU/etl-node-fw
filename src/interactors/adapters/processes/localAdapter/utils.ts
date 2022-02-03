
import { RegisterStatusTag, ReservedEntityTypes, SyncContext } from "../../../../business/register";
import { RegisterInitValues } from "../../../../business/registerUtils";
import { RegisterDataAccess, RegisterDataFilter } from "../../../common/registers";
import { EntityFetcher, MetaEntity, ValidationResult, ValidationStatusTag } from "../../definitions/localAdapter/types";

export const getValidationResultWithMeta = (validation: ValidationResult | ValidationStatusTag): ValidationResult => {
    if (isValidationResult(validation)) {
        return validation
    } else {
        return {
            statusTag: validation,
            meta: null
        }
    }
}

function isValidationResult(validation?: any): validation is ValidationResult {
    return validation?.statusTag != undefined
}

export const validationTagToRegisterTag = (validationStatusTag: ValidationStatusTag) => {
    const validationMap = {
        [ValidationStatusTag.invalid]: RegisterStatusTag.invalid,
        [ValidationStatusTag.skipped]: RegisterStatusTag.skipped,
        [ValidationStatusTag.valid]: RegisterStatusTag.success,
    }
    return validationMap[validationStatusTag]
}
export class ContextEntityFetcher implements EntityFetcher {

    private readonly syncContext: SyncContext
    private readonly registerDataAccess: RegisterDataAccess
    private readonly fetchHistory: RegisterDataFilter[]

    constructor(syncContext: SyncContext, registerDataAccess: RegisterDataAccess) {
        this.syncContext = syncContext
        this.registerDataAccess = registerDataAccess
        this.fetchHistory = []
    }

    async getMetaEntities(filter?: RegisterDataFilter) {
        filter = { ...filter, ...this.syncContext }
        this.fetchHistory.push(filter)
        const registers = await this.registerDataAccess.getAll(filter)
        return registers.map(register => {
            const metaEntity: MetaEntity = {
                $entity: register.entity,
                $meta: register.meta,
                $id: register.sourceEntityId || undefined,
            }
            return metaEntity
        })
    }

    async getFlowConfig() {
        const configPushedRegisters = await this.registerDataAccess.getAll({
            entityType: ReservedEntityTypes.flowConfig,
            flowId: this.syncContext.flowId
        })
        return configPushedRegisters[0]?.entity
    }

    getHistory(): RegisterDataFilter[] {
        return this.fetchHistory;
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