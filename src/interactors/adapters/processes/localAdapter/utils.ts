import { RegisterStatusTag } from "../../../../business/register";
import { ValidationResult, ValidationStatusTag } from "../../definitions/localAdapter/types";

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