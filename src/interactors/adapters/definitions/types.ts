import EventEmitter from "events"
import { Entity } from "../../registers/types"
import { AdapterDefinition, AdapterDependencies, EntityWithMeta, RegisterDataAccess, RegisterDataFilter } from "../types"


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

export type EntityInitValues<e extends Entity> = {
    entity: e | null,
    meta: any,
    sourceAbsoluteId: any,
    sourceRelativeId: any,
}

export interface EntityFetcher {//For a specific syncContext
    getEntities: (filter?: RegisterDataFilter) => Promise<EntityWithMeta<Entity>[]>
}
