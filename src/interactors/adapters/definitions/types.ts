import EventEmitter from "events"
import { Entity, Register, RegisterStatusTag } from "../../registers/types"
import { AdapterDefinition, AdapterDependencies, EntityWithMeta } from "../types"


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

export interface RegisterDataAccess {//For a specific syncContext
    save: (register: Register<Entity>) => Promise<void>
    saveAll: (registers: Register<Entity>[]) => Promise<void>
    get: (id: string) => Promise<Register<Entity> | null>
    getAll: (filter?: RegisterDataFilter, registersIds?: string[]) => Promise<Register<Entity>[]>
}

export interface EntityFetcher {//For a specific syncContext
    getEntities: (filter?: RegisterDataFilter) => Promise<EntityWithMeta<Entity>[]>
}

export type RegisterDataFilter = {
    flowId?: string,
    stepId?: string,
    apdaterId?: string,
    registerType?: string,
    registerStatus?: RegisterStatusTag
}