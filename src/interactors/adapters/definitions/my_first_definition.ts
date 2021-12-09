import EventEmitter from "events";
import { Entity, Register, RegisterDataAccess, RegisterStatusTag } from "../../registers/types";
import { Adapter, AdapterStatus, AdapterDefinition, EntityWithMeta, AdapterStatusTag, AdapterRunOptions, AdapterStatusSummary } from "../types"


abstract class MyAdapter<ad extends AdapterDefinition> implements Adapter<ad>{

    protected readonly adapterDefinition: ad;
    protected readonly adapterRegisters: Register<Entity>[];
    protected readonly adapterPresenter: EventEmitter
    protected readonly registerDataAccess: RegisterDataAccess<Entity>;
    protected readonly adapterStatus: AdapterStatus


    constructor(dependencies: MyAdapterDependencies<ad>) {
        this.adapterRegisters = [];
        this.adapterDefinition = dependencies.adapterDefinition;
        this.adapterPresenter = dependencies.adapterPresenter;
        this.registerDataAccess = dependencies.registerDataAccess;
        this.adapterStatus = {
            id: Math.random().toString(),
            definitionId: this.adapterDefinition.id,
            definitionType: this.adapterDefinition.definitionType,
            outputType: this.adapterDefinition.outputType,
            statusTag: AdapterStatusTag.notProcessed,
            summary: null,
            meta: null,
        }
        this.adapterPresenter.emit("adapterStatus", this.adapterStatus)
    }

    async start(runOptions?: AdapterRunOptions): Promise<AdapterStatusTag> {
        await this.run(runOptions);
        await this.saveRegisters();
        this.adapterStatus.summary = this.calculateSummary();
        this.adapterStatus.statusTag = this.calculateStatus(this.adapterStatus.summary)
        this.adapterStatus.meta = { runOptions }
        this.adapterPresenter.emit("adapterStatus", this.adapterStatus)
        return this.adapterStatus.statusTag;
    }

    abstract run(runOptions?: AdapterRunOptions): Promise<void>

    private calculateSummary(): AdapterStatusSummary {
        const summary = {
            output_rows: this.adapterRegisters.length,
            rows_success: this.adapterRegisters.filter(register => register.statusTag == RegisterStatusTag.success).length,
            rows_failed: this.adapterRegisters.filter(register => register.statusTag == RegisterStatusTag.failed).length,
            rows_invalid: this.adapterRegisters.filter(register => register.statusTag == RegisterStatusTag.invalid).length,
            rows_skipped: this.adapterRegisters.filter(register => register.statusTag == RegisterStatusTag.skipped).length,
        };
        return summary;
    }

    private calculateStatus(summary: AdapterStatusSummary): AdapterStatusTag {
        if (summary.output_rows == summary.rows_success)
            return AdapterStatusTag.success;
        else if (summary.output_rows == summary.rows_failed)
            return AdapterStatusTag.failed;
        else if (summary.output_rows == summary.rows_skipped)
            return AdapterStatusTag.skipped;
        else if (summary.output_rows == summary.rows_invalid)
            return AdapterStatusTag.invalid;
        else
            return AdapterStatusTag.successPartial;
    }

    // private async saveData() {
    //     await this.adapterPersistance.save(this.adapterStatus)
    // }

    private async saveRegisters() {
        await this.registerDataAccess.saveAll(this.adapterRegisters, { apdaterId: this.adapterStatus.id })
    }

    protected getMockedRegisters(inputEntities?: (EntityWithMeta<Entity> | null | Entity)[]): Register<Entity>[] | null {

        if (!inputEntities)
            return null;

        return inputEntities.map(inputEntity => {
            return {
                id: Math.random().toString(),
                entityType: "Mocked",
                source_id: null,
                statusTag: RegisterStatusTag.success,
                statusMeta: null,
                entity: inputEntity.entity,
                meta: inputEntity.meta
            }
        })
    }

    async getStatus() {
        return this.adapterStatus;
    }

}

/**
 * Local async step, persistance
 * row-by-row
 * 1 input 1 output
 */
export class MyExtractorAdapter<ad extends MyAdapterExtractorDefinition<Entity>> extends MyAdapter<ad>{

    constructor(dependencies: any) {
        super(dependencies)
    }

    async run(runOptions?: AdapterRunOptions) {
        const inputEntities = runOptions?.mockEntities || (await this.adapterDefinition.entitiesGet(runOptions?.getOptions));
        await this.initRegisters(inputEntities);
        await this.validateRegisters();
        await this.fixRegisters();
    }

    private async initRegisters(inputEntities: (EntityWithMeta<Entity> | null | Entity)[]) {
        for (let inputEntity of inputEntities) {

            if (!inputEntity)
                inputEntity = {
                    entity: null,
                    meta: null,
                }
            else if (!inputEntity.entity) {
                inputEntity = {
                    entity: inputEntity,
                    meta: null,
                }
            }

            // const inputEntityId = await this.adapterDefinition.generateID(inputEntity.entity)
            const inputEntityId = Math.random().toString();
            const adapterRegister: Register<Entity> = {
                id: inputEntityId,
                entityType: this.adapterDefinition.outputType,
                source_id: null,
                statusTag: RegisterStatusTag.notProcessed,
                statusMeta: null,
                entity: inputEntity.entity,
                meta: inputEntity.meta
            }
            this.adapterRegisters.push(adapterRegister)
        }
    }

    private async validateRegisters() {
        for (const adapterRegister of this.adapterRegisters) {
            try {
                const validationResult = await this.adapterDefinition.entityValidate(adapterRegister.entity);

                if (validationResult.statusTag == ValidationStatusTag.invalid) {
                    adapterRegister.statusTag = RegisterStatusTag.invalid;
                }

                else if (validationResult.statusTag == ValidationStatusTag.skipped) {
                    adapterRegister.statusTag = RegisterStatusTag.skipped;
                }

                else if (validationResult.statusTag == ValidationStatusTag.valid) {
                    adapterRegister.statusTag = RegisterStatusTag.success;
                }

                adapterRegister.statusMeta = validationResult.meta;

            } catch (error: any) {
                adapterRegister.statusTag = RegisterStatusTag.failed;
                adapterRegister.statusMeta = error.message;
            }
        }
    }

    private async fixRegisters() {
        const toFixRegisters = this.adapterRegisters.filter(register => register.statusTag == RegisterStatusTag.invalid);
        for (const toFixRegister of toFixRegisters) {
            try {
                const toFixEntity: ToFixEntity<Entity> = {
                    entity: toFixRegister.entity,
                    validationMeta: toFixRegister.statusMeta
                }
                const fixedEntity = await this.adapterDefinition.entityFix(toFixEntity);
                if (fixedEntity) {
                    toFixRegister.entity = fixedEntity.entity;
                    toFixRegister.statusTag = RegisterStatusTag.success;
                    toFixRegister.statusMeta = fixedEntity.meta;
                } else {
                    toFixRegister.statusTag = RegisterStatusTag.invalid;
                }

            } catch (error) {
                toFixRegister.statusTag = RegisterStatusTag.invalid;
            }
        }
    }

}

export abstract class MyAdapterExtractorDefinition<input extends Entity> implements AdapterDefinition {
    abstract readonly definitionType: string;
    abstract readonly id: string;
    abstract readonly outputType: string
    // generateID:(entity:input) => Promise<string | null>
    // getTrackFields: (entity:input) => Promise<string[]>
    abstract entitiesGet: (options: any) => Promise<(EntityWithMeta<input> | null | input)[]>
    abstract entityValidate: (outputEntity: input | null) => Promise<ValidationResult> //data quality, error handling (error prevention), managin Bad Data-> triage or CleanUp
    abstract entityFix: (toFixEntity: ToFixEntity<input>) => Promise<FixedEntity<input> | null> //error handling (error response), managin Bad Data-> CleanUp
}


/**
 * Local async step, persistance
 * row-by-row
 * 1 input 1 output
 */
export class MyTransformerAdapter<ad extends MyAdapterTransformerDefinition<Entity, Entity>> extends MyAdapter<ad>{

    constructor(dependencies: any) {
        super(dependencies)
    }

    async run(runOptions?: AdapterRunOptions) {
        const inputRegisters =
            this.getMockedRegisters(runOptions?.mockEntities) ||
            (await this.registerDataAccess.getAll({ registerType: this.adapterDefinition.inputType, registerStatus: RegisterStatusTag.success }))
        await this.processEntities(inputRegisters);
    }

    private async processEntities(inputRegisters: Register<any>[]) {
        for (const inputRegistry of inputRegisters) {
            try {
                const inputEntity = inputRegistry.entity;
                const outputEntity = await this.adapterDefinition.entityProcess(inputEntity);
                const adapterRegister: Register<Entity> = {
                    // id: await this.adapterDefinition.generateID(outputEntity),
                    id: Math.random().toString(),
                    entityType: this.adapterDefinition.outputType,
                    source_id: inputRegistry.id,
                    statusTag: RegisterStatusTag.success,
                    statusMeta: undefined,
                    entity: outputEntity,
                    meta: undefined,
                }
                this.adapterRegisters.push(adapterRegister)
            } catch (error: any) {
                const adapterRegister: Register<Entity> = {
                    // id: inputRegistry.id,
                    id: Math.random().toString(),
                    entityType: this.adapterDefinition.outputType,
                    source_id: inputRegistry.id,
                    statusTag: RegisterStatusTag.failed,
                    statusMeta: error.message,
                    entity: null,
                    meta: undefined
                }
                this.adapterRegisters.push(adapterRegister)
            }
        }
    }

}

export abstract class MyAdapterTransformerDefinition<input extends Entity, output extends Entity> implements AdapterDefinition {
    // readonly version: string
    abstract readonly id: string;
    abstract readonly inputType: string
    abstract readonly outputType: string
    abstract readonly definitionType: string;
    // generateID:(entity:output) => Promise<string | null>
    // getTrackFields: (entity:output) => Promise<string[]>
    abstract entityProcess: (entity: input) => Promise<output> //first time (success), on retry (failed entities)
}


/**
 * Local async step, persistance
 * row-by-row
 * 1 input 1 output
 */
export class MyConsumerAdapter<ad extends MyAdapterConsumerDefinition<Entity, Entity>> extends MyAdapter<ad>{

    constructor(dependencies: any) {
        super(dependencies)
    }

    async run(runOptions?: AdapterRunOptions) {
        const inputRegisters =
            this.getMockedRegisters(runOptions?.mockEntities) ||
            (await this.registerDataAccess.getAll({ registerType: this.adapterDefinition.inputType }))
        await this.loadEntities(inputRegisters);
    }

    private async loadEntities(inputRegisters: Register<Entity>[]) {
        for (const inputRegistry of inputRegisters) {
            try {
                const inputEntity = inputRegistry.entity;
                const outputEntity = await this.adapterDefinition.entityLoad(inputEntity);
                const adapterRegister: Register<Entity> = {
                    // id: await this.adapterDefinition.generateID(outputEntity),
                    id: Math.random().toString(),
                    entityType: this.adapterDefinition.outputType,
                    source_id: inputRegistry.id,
                    statusTag: RegisterStatusTag.success,
                    statusMeta: undefined,
                    entity: outputEntity,
                    meta: undefined
                }
                this.adapterRegisters.push(adapterRegister)
            } catch (error) {
                const adapterRegister: Register<Entity> = {
                    id: Math.random().toString(),
                    entityType: this.adapterDefinition.outputType,
                    source_id: inputRegistry.id,
                    statusTag: RegisterStatusTag.failed,
                    statusMeta: undefined,
                    entity: null,
                    meta: undefined
                }
                this.adapterRegisters.push(adapterRegister)
            }
        }
    }
}

export abstract class MyAdapterConsumerDefinition<input extends Entity, output extends Entity> implements AdapterDefinition {
    // readonly version: string
    abstract readonly id: string;
    abstract readonly inputType: string
    abstract readonly outputType: string
    abstract readonly definitionType: string;
    // generateID:(entity:output) => Promise<string | null>
    // getTrackFields: (entity:output) => Promise<string[]>
    abstract entityLoad: (entity: input | null) => Promise<output> //first time (success), on retry (failed entities)
}


/**
 * Local async step, persistance
 * row-by-row
 * unknown input 1 output
 */
export class MyFlexAdapter<ad extends MyAdapterFlexDefinition<Entity>> extends MyAdapter<ad>{

    constructor(dependencies: any) {
        super(dependencies)
    }

    async run(runOptions?: AdapterRunOptions) {
        const inputRegisters = this.getMockedRegisters(runOptions?.mockEntities) || (await this.adapterDefinition.registersGet(runOptions?.getOptions));
        await this.processEntities(inputRegisters);
    }

    private async processEntities(inputRegisters: Register<Entity>[]) {
        for (const inputRegistry of inputRegisters) {
            try {
                const inputEntity = inputRegistry.entity;
                const outputEntity = await this.adapterDefinition.entityProcess(inputEntity);
                const adapterRegister: Register<Entity> = {
                    // id: await this.adapterDefinition.generateID(outputEntity),
                    id: Math.random().toString(),
                    entityType: this.adapterDefinition.outputType,
                    source_id: inputRegistry.id,
                    statusTag: RegisterStatusTag.success,
                    statusMeta: undefined,
                    entity: outputEntity,
                    meta: undefined,
                }
                this.adapterRegisters.push(adapterRegister)
            } catch (error: any) {
                const adapterRegister: Register<Entity> = {
                    id: Math.random().toString(),
                    entityType: this.adapterDefinition.outputType,
                    source_id: inputRegistry.id,
                    statusTag: RegisterStatusTag.failed,
                    statusMeta: error.message,
                    entity: null,
                    meta: undefined
                }
                this.adapterRegisters.push(adapterRegister)
            }
        }
    }

}

export abstract class MyAdapterFlexDefinition<output extends Entity> implements AdapterDefinition {
    // readonly version: string
    abstract readonly id: string;
    abstract readonly outputType: string
    abstract readonly definitionType: string;
    // generateID:(entity:output) => Promise<string | null>
    // getTrackFields: (entity:output) => Promise<string[]>
    abstract registersGet: (options: Entity) => Promise<Register<Entity>[]>
    abstract entityProcess: (entity: Entity | null) => Promise<output> //first time (success), on retry (failed entities)
}





/**
 * Utils
 */

export type MyAdapterDependencies<ad extends AdapterDefinition> = {
    adapterDefinition: ad
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
