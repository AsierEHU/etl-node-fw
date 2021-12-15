import EventEmitter from "events"
import { Entity, Register, RegisterStatusTag } from "../../registers/types"
import { AdapterDefinition, AdapterDependencies } from "../types"


export interface MyAdapterDependencies<ad extends AdapterDefinition> extends AdapterDependencies<ad> {
    adapterPresenter: EventEmitter
    registerDataAccess: RegisterDataAccess<Entity>
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

export interface RegisterDataAccess<e extends Entity> {//For a specific syncContext
    save: (register: Register<e>) => Promise<void>
    saveAll: (registers: Register<e>[]) => Promise<void>
    get: (id: string) => Promise<Register<e> | null>
    getAll: (filter?: RegisterDataFilter, registersIds?: string[]) => Promise<Register<e>[]>
}

export type RegisterDataFilter = {
    flowId?: string,
    stepId?: string,
    apdaterId?: string,
    registerType?: string,
    registerStatus?: RegisterStatusTag
}