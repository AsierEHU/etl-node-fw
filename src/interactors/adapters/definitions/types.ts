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

export type ToFixEntity<input extends Entity> = {
    entity: input | null,
    validationMeta: any
}

export type FixedEntity<input extends Entity> = {
    entity: input,
    meta: any
}

export interface RegisterDataAccess<entity extends Entity> {//For a specific syncContext
    save: (register: Register<entity>) => Promise<void>
    saveAll: (registers: Register<entity>[]) => Promise<void>
    get: (id: string) => Promise<Register<entity> | null>
    getAll: (filter?: RegisterDataFilter, registersIds?: string[]) => Promise<Register<entity>[]>
}

export type RegisterDataFilter = {
    flowId?: string,
    stepId?: string,
    apdaterId?: string,
    registerType?: string,
    registerStatus?: RegisterStatusTag
}