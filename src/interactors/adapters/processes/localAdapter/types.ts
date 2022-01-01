
export enum ValidationStatusTag {
    valid = "valid",
    invalid = "invalid",
    skipped = "skipped",
}

export type ValidationResult = {
    statusTag: ValidationStatusTag
    meta: any
}

export type ToFixEntity<e extends object> = {
    entity: e | null,
    validationMeta: any
}

export type FixedEntity<e extends object> = {
    entity: e,
    meta: any
}