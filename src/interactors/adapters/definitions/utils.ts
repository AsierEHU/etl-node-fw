import { Entity, EntityWithMeta, RegisterStatusTag } from "../../registers/types";
import { isEntityWithMeta } from "../../registers/utils"
import { InputEntity } from "../types";
import { ValidationResult, ValidationStatusTag } from "./types";

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