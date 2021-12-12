import EventEmitter from "events";
import { Entity, Register, RegisterDataContext, RegisterStatusTag } from "../../registers/types";
import { Adapter, AdapterStatus, AdapterDefinition, EntityWithMeta, AdapterRunOptions, AdapterStatusSummary, AdapterDependencies } from "../types"


/**
 * Local async step, persistance
 * row-by-row
 * Throw excepcion on unexpected error (all records fail)
 * Check failed on handle error (1 record fails)
 */
abstract class MyAdapter<ad extends AdapterDefinition> implements Adapter<ad>{

    protected readonly adapterDefinition: ad;
    protected readonly adapterRegisters: Register<Entity>[];
    protected readonly adapterPresenter: EventEmitter
    protected readonly registerDataAccess: RegisterDataAccess<Entity>;
    protected readonly adapterStatus: AdapterStatus
    protected readonly syncUpperContext?: RegisterDataContext


    constructor(dependencies: MyAdapterDependencies<ad>) {
        this.adapterRegisters = [];
        this.adapterDefinition = dependencies.adapterDefinition;
        this.adapterPresenter = dependencies.adapterPresenter;
        this.registerDataAccess = dependencies.registerDataAccess;
        this.syncUpperContext = dependencies.syncContext;
        const id = Math.random().toString();

        this.adapterStatus = {
            id,
            definitionId: this.adapterDefinition.id,
            definitionType: this.adapterDefinition.definitionType,
            outputType: this.adapterDefinition.outputType,
            statusSummary: null,
            meta: null,
            syncContext: { ...this.syncUpperContext, apdaterId: id }
        }
        this.adapterPresenter.emit("adapterStatus", this.adapterStatus)
    }

    async start(runOptions?: AdapterRunOptions): Promise<AdapterStatusSummary> {
        await this.run(runOptions);
        this.adapterStatus.statusSummary = this.calculateSummary();
        this.adapterStatus.meta = { runOptions }
        this.adapterPresenter.emit("adapterStatus", this.adapterStatus)
        return this.adapterStatus.statusSummary;
    }

    protected abstract run(runOptions?: AdapterRunOptions): Promise<void>

    private calculateSummary(): AdapterStatusSummary {
        const statusSummary = {
            output_rows: this.adapterRegisters.length,
            rows_success: this.adapterRegisters.filter(register => register.statusTag == RegisterStatusTag.success).length,
            rows_failed: this.adapterRegisters.filter(register => register.statusTag == RegisterStatusTag.failed).length,
            rows_invalid: this.adapterRegisters.filter(register => register.statusTag == RegisterStatusTag.invalid).length,
            rows_skipped: this.adapterRegisters.filter(register => register.statusTag == RegisterStatusTag.skipped).length,
        };
        return statusSummary;
    }

    protected async saveRegisters() {
        await this.registerDataAccess.saveAll(this.adapterRegisters)
    }

    protected async saveRegister(register: Register<Entity>) {
        await this.registerDataAccess.save(register)
    }

    protected getMockedRegisters(inputEntities?: any[]): Register<Entity>[] {

        if (!inputEntities)
            return [];

        const inputEntitiesWithMeta = this.getInputFormat(inputEntities);

        return inputEntitiesWithMeta.map(inputEntity => {
            return {
                id: Math.random().toString(),
                entityType: "Mocked",
                source_id: null,
                statusTag: RegisterStatusTag.success,
                statusMeta: null,
                entity: inputEntity.entity,
                meta: inputEntity.meta,
                context: this.adapterStatus.syncContext
            }
        })
    }

    protected getInputFormat(inputEntities: any[]): EntityWithMeta<Entity>[] {

        return inputEntities.map(inputEntity => {
            if (inputEntity?.entity && inputEntity?.meta) {
                return inputEntity;

            }
            else if (inputEntity) {
                return {
                    entity: inputEntity,
                    meta: null,
                }
            }
            else {
                return {
                    entity: null,
                    meta: null,
                }
            }
        })
    }

    async getStatus() {
        return this.adapterStatus;
    }

    async getRegisters() {
        return this.adapterRegisters
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
        const inputEntitiesWithMeta = await this.inputEntities(runOptions);
        await this.initRegisters(inputEntitiesWithMeta);
        await this.validateRegisters();
        await this.fixRegisters();
        await this.saveRegisters();
    }

    private async inputEntities(runOptions?: AdapterRunOptions): Promise<EntityWithMeta<Entity>[]> {
        let inputEntities: any = [];

        if (runOptions?.registers) {
            inputEntities = runOptions.registers.map(register => register.entity)
        }
        else if (runOptions?.mockEntities) {
            inputEntities = runOptions?.mockEntities
        }
        else if (runOptions?.onlyFailedEntities) {
            const inputRegisters = (await this.registerDataAccess.getAll({
                registerType: this.adapterDefinition.outputType,
                registerStatus: RegisterStatusTag.failed,
                stepId: this.adapterStatus.syncContext.stepId
            }))
            inputEntities = inputRegisters.map(register => register.entity)
        }
        else {
            inputEntities = (await this.adapterDefinition.entitiesGet());
        }

        const inputEntitiesWithMeta = this.getInputFormat(inputEntities)

        return inputEntitiesWithMeta;
    }

    private async initRegisters(inputEntities: EntityWithMeta<Entity>[]) {
        for (let inputEntity of inputEntities) {
            // const inputEntityId = await this.adapterDefinition.generateID(inputEntity.entity)
            const inputEntityId = Math.random().toString();
            const adapterRegister: Register<Entity> = {
                id: inputEntityId,
                entityType: this.adapterDefinition.outputType,
                source_id: null,
                statusTag: RegisterStatusTag.pending,
                statusMeta: null,
                entity: inputEntity.entity,
                meta: inputEntity.meta,
                context: this.adapterStatus.syncContext
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
                    toFixRegister.statusMeta = { ...toFixRegister.statusMeta, fixMeta: fixedEntity.meta }
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
    abstract entitiesGet: () => Promise<(EntityWithMeta<input> | null | input)[]>
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
        const inputRegisters = await this.inputRegisters(runOptions)
        await this.processRegisters(inputRegisters);
        await this.saveRegisters();
    }

    private async inputRegisters(runOptions?: AdapterRunOptions): Promise<Register<Entity>[]> {
        let inputRegisters = [];

        if (runOptions?.registers) {
            inputRegisters = runOptions.registers
        }
        else if (runOptions?.mockEntities) {
            inputRegisters = this.getMockedRegisters(runOptions?.mockEntities)
        }
        else if (runOptions?.onlyFailedEntities) {
            const outputRegisters = await this.registerDataAccess.getAll({
                registerType: this.adapterDefinition.outputType,
                registerStatus: RegisterStatusTag.failed,
                stepId: this.adapterStatus.syncContext.stepId
            })
            const inputRegistersIds = outputRegisters.map(outputRegister => outputRegister.source_id) as string[]
            inputRegisters = await this.registerDataAccess.getAll(undefined, inputRegistersIds)
        }
        else {
            inputRegisters = await this.registerDataAccess.getAll({
                registerType: this.adapterDefinition.inputType,
                registerStatus: RegisterStatusTag.success,
                flowId: this.adapterStatus.syncContext.flowId
            })
        }

        return inputRegisters;
    }

    private async processRegisters(inputRegisters: Register<any>[]) {
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
                    context: this.adapterStatus.syncContext
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
                    meta: undefined,
                    context: this.adapterStatus.syncContext
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
export class MyLoaderAdapter<ad extends MyAdapterLoaderDefinition<Entity, Entity>> extends MyAdapter<ad>{

    constructor(dependencies: any) {
        super(dependencies)
    }

    async run(runOptions?: AdapterRunOptions) {
        const inputRegisters = await this.inputRegisters(runOptions)
        await this.loadAndSaveRegisters(inputRegisters);
    }

    private async inputRegisters(runOptions?: AdapterRunOptions): Promise<Register<Entity>[]> {
        let inputRegisters = [];
        if (runOptions?.registers) {
            inputRegisters = runOptions.registers
        }
        else if (runOptions?.mockEntities) {
            inputRegisters = this.getMockedRegisters(runOptions?.mockEntities)
        }
        else if (runOptions?.onlyFailedEntities) {
            const outputRegisters = await this.registerDataAccess.getAll({
                registerType: this.adapterDefinition.outputType,
                registerStatus: RegisterStatusTag.failed,
                stepId: this.adapterStatus.syncContext.stepId
            })
            const inputRegistersIds = outputRegisters.map(outputRegister => outputRegister.source_id) as string[]
            inputRegisters = await this.registerDataAccess.getAll(undefined, inputRegistersIds)
        }
        else {
            inputRegisters = await this.registerDataAccess.getAll({
                registerType: this.adapterDefinition.inputType,
                registerStatus: RegisterStatusTag.success,
                flowId: this.adapterStatus.syncContext.flowId
            })
        }

        return inputRegisters;
    }


    private async loadAndSaveRegisters(inputRegisters: Register<Entity>[]) {
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
                    meta: undefined,
                    context: this.adapterStatus.syncContext
                }
                this.adapterRegisters.push(adapterRegister)
                await this.saveRegister(adapterRegister);
            } catch (error: any) {
                const adapterRegister: Register<Entity> = {
                    id: Math.random().toString(),
                    entityType: this.adapterDefinition.outputType,
                    source_id: inputRegistry.id,
                    statusTag: RegisterStatusTag.failed,
                    statusMeta: error.message,
                    entity: null,
                    meta: undefined,
                    context: this.adapterStatus.syncContext
                }
                this.adapterRegisters.push(adapterRegister)
                await this.saveRegister(adapterRegister);
            }
        }
    }
}

export abstract class MyAdapterLoaderDefinition<input extends Entity, output extends Entity> implements AdapterDefinition {
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
        const inputRegisters = await this.inputRegisters(runOptions);
        await this.processRegisters(inputRegisters);
    }

    private async inputRegisters(runOptions?: AdapterRunOptions): Promise<Register<Entity>[]> {
        let inputRegisters = [];
        if (runOptions?.registers) {
            inputRegisters = runOptions.registers
        }
        else if (runOptions?.mockEntities) {
            inputRegisters = this.getMockedRegisters(runOptions?.mockEntities)
        }
        else if (runOptions?.onlyFailedEntities) {
            const outputRegisters = (await this.registerDataAccess.getAll({
                registerType: this.adapterDefinition.outputType,
                registerStatus: RegisterStatusTag.failed,
                stepId: this.adapterStatus.syncContext.stepId
            }))
            const inputRegistersIds = outputRegisters.map(outputRegister => outputRegister.source_id) as string[]
            inputRegisters = await this.registerDataAccess.getAll(undefined, inputRegistersIds)
        }
        else {
            inputRegisters = await this.adapterDefinition.registersGet()
        }

        return inputRegisters;
    }

    private async processRegisters(inputRegisters: Register<Entity>[]) {
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
                    context: this.adapterStatus.syncContext
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
                    meta: undefined,
                    context: this.adapterStatus.syncContext
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
    abstract registersGet: () => Promise<Register<Entity>[]>
    abstract entityProcess: (entity: Entity | null) => Promise<output> //first time (success), on retry (failed entities)
}





/**
 * Utils
 */

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

export interface RegisterDataAccess<entity extends Entity> {//For a specific context
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