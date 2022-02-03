
import { RegisterDataFilter } from "../../../common/registers";
import { AdapterDefinition } from "../types";

export abstract class LocalAdapterExtractorDefinition<output extends object> implements AdapterDefinition {
    abstract readonly definitionType: string;
    abstract readonly id: string;
    abstract readonly outputType: string
    abstract readonly entitiesGet: (entityFetcher: EntityFetcher) => Promise<InputEntity<output>[]>
    abstract readonly entityValidate: (inputEntity: output | null) => Promise<ValidationResult | ValidationStatusTag>
    abstract readonly entityFix: (toFixEntity: ToFixEntity<output>) => Promise<FixedEntity<output> | null>
}

export abstract class LocalAdapterLoaderDefinition<input extends object, output extends object> implements AdapterDefinition {
    abstract readonly id: string;
    abstract readonly inputType: string
    abstract readonly outputType: string
    abstract readonly definitionType: string;
    abstract readonly entityLoad: (entity: input) => Promise<InputEntity<output>>
    abstract readonly entityValidate: (outputEntity: output | null) => Promise<ValidationResult | ValidationStatusTag>
}

export abstract class LocalAdapterTransformerRowDefinition<input, output> implements AdapterDefinition {
    abstract readonly id: string;
    abstract readonly inputType: string
    abstract readonly outputType: string
    abstract readonly definitionType: string;
    abstract readonly entityProcess: (entity: input) => Promise<output>
}


export abstract class LocalAdapterSetTransformerDefinition<output extends object> implements AdapterDefinition {
    abstract readonly id: string;
    abstract readonly inputTypes: string[]
    abstract readonly outputType: string
    abstract readonly definitionType: string;
    abstract readonly setsProcess: (sets: { [type: string]: object[] }) => Promise<InputEntity<output>[]>
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

export type ToFixEntity<e extends object> = {
    entity: e | null,
    validationMeta: any
}

export type FixedEntity<e extends object> = {
    entity: e,
    meta: any
}

export type InputEntity<e extends object> = MetaEntity | null | e

export type MetaEntity = {
    $entity: object | null,
    $meta?: any,
    $id?: string
}

export interface EntityFetcher {
    getMetaEntities: (filter?: RegisterDataFilter) => Promise<MetaEntity[]>
    getFlowConfig: () => Promise<any>
}