import { Entity, Register, RegisterStatusTag } from "../../registers/types";
import { AdapterStatusSummary, EntityWithMeta, InputEntity } from "../types";
import { ValidationResult, ValidationStatusTag } from "./types";

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
