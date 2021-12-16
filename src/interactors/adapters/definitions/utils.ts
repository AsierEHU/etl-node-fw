import { uniqBy } from "lodash";
import { Entity, Register, RegisterStatusTag, SyncContext } from "../../registers/types";
import { AdapterStatusSummary, EntityWithMeta, InputEntity } from "../types";
import { EntityFetcher, RegisterDataAccess, RegisterDataFilter, ValidationResult, ValidationStatusTag } from "./types";

export const getWithMetaFormat = (inputEntities: InputEntity<Entity>[]): EntityWithMeta<Entity>[] => {
    return inputEntities.map(inputEntity => {
        if (isEntityWithMeta(inputEntity)) {
            return inputEntity
        }
        else {
            return {
                entity: inputEntity,
                meta: null
            }
        }
    })
}

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

function isEntityWithMeta(inputEntity?: any): inputEntity is EntityWithMeta<Entity> {
    return inputEntity?.entity != undefined
}

function isValidationResult(validation?: any): validation is ValidationResult {
    return validation?.statusTag != undefined
}

export const calculateSummary = (outputRegisters: Register<Entity>[]): AdapterStatusSummary => {
    const statusSummary = {
        output_rows: outputRegisters.length,
        rows_success: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.success).length,
        rows_failed: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.failed).length,
        rows_invalid: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.invalid).length,
        rows_skipped: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.skipped).length,
    };
    return statusSummary;
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

    async getEntities(filter?: RegisterDataFilter) {
        filter = { ...filter, ...this.syncContext }
        this.fetchHistory.push(filter)
        const registers = await this.registerDataAccess.getAll(filter)
        return registers.map(register => { return { entity: register.entity, meta: register.meta } })
    }

    getHistory(): RegisterDataFilter[] {
        return this.fetchHistory;
    }

}

export class AdvancedRegisterFetcher {

    private readonly registerDataAccess: RegisterDataAccess

    constructor(registerDataAccess: RegisterDataAccess) {
        this.registerDataAccess = registerDataAccess
    }

    async getRelativeRegisters(baseRegisters: Register<Entity>[]): Promise<Register<Entity>[]> {
        const uniqueBaseRegisters = uniqBy(baseRegisters, 'sourceRelativeId')
        const targetRegistersIds = uniqueBaseRegisters.map(baseRegister => baseRegister.sourceRelativeId) as string[]
        const targetRegisters = await this.registerDataAccess.getAll(undefined, targetRegistersIds)
        return targetRegisters
    }

    async getAbsoluteRegisters(baseRegisters: Register<Entity>[]): Promise<Register<Entity>[]> {
        const uniqueBaseRegisters = uniqBy(baseRegisters, 'sourceAbsoluteId')
        const targetRegistersIds = uniqueBaseRegisters.map(baseRegister => baseRegister.sourceAbsoluteId) as string[]
        const targetRegisters = await this.registerDataAccess.getAll(undefined, targetRegistersIds)
        return targetRegisters
    }
}

export const validationTagToRegisterTag = (validationStatusTag: ValidationStatusTag) => {
    const validationMap = {
        [ValidationStatusTag.invalid]: RegisterStatusTag.invalid,
        [ValidationStatusTag.skipped]: RegisterStatusTag.skipped,
        [ValidationStatusTag.valid]: RegisterStatusTag.success,
    }
    return validationMap[validationStatusTag]
}