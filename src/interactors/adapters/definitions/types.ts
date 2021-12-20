import EventEmitter from "events"
import { Entity, RegisterDataAccess } from "../../registers/types"
import { AdapterDefinition, AdapterDependencies } from "../types"


export interface MyAdapterDependencies<ad extends AdapterDefinition> extends AdapterDependencies<ad> {
    adapterPresenter: EventEmitter
    registerDataAccess: RegisterDataAccess
}

export enum ValidationStatusTag {
    valid = "valid",
    invalid = "invalid",
    skipped = "skipped",
}

export type ValidationResult = {
    statusTag: ValidationStatusTag
    meta: any
}

export type ToFixEntity<e extends Entity> = {
    entity: e | null,
    validationMeta: any
}

export type FixedEntity<e extends Entity> = {
    entity: e,
    meta: any
}
