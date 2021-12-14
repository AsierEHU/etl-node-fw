import EventEmitter from "events";
import { Entity, Register, RegisterDataContext, RegisterStatusTag } from "../../../registers/types";
import { Adapter, AdapterStatus, AdapterDefinition, EntityWithMeta, AdapterRunOptions, AdapterStatusSummary } from "../../types"
import { v4 as uuidv4 } from 'uuid';
import { FixedEntity, MyAdapterDependencies, RegisterDataAccess, ToFixEntity, ValidationResult, ValidationStatusTag } from "./types";
import { calculateSummary, getWithMetaFormat } from "./utils";



/**
 * Local async step, persistance
 * row-by-row
 * Throw excepcion on unexpected error (all records fail)
 * Check failed on handle error (1 record fails)
 */
abstract class MyAdapter<ad extends AdapterDefinition> implements Adapter<ad>{

    protected readonly adapterDefinition: ad;
    protected readonly adapterPresenter: EventEmitter
    protected readonly registerDataAccess: RegisterDataAccess<Entity>;
    protected readonly adapterStatus: AdapterStatus
    protected readonly syncUpperContext?: RegisterDataContext


    constructor(dependencies: MyAdapterDependencies<ad>) {
        this.adapterDefinition = dependencies.adapterDefinition;
        this.adapterPresenter = dependencies.adapterPresenter;
        this.registerDataAccess = dependencies.registerDataAccess;
        this.syncUpperContext = dependencies.syncContext;

        const id = uuidv4();
        this.adapterStatus = {
            id,
            definitionId: this.adapterDefinition.id,
            definitionType: this.adapterDefinition.definitionType,
            outputType: this.adapterDefinition.outputType,
            statusSummary: null,
            runOptions: null,
            syncContext: { ...this.syncUpperContext, apdaterId: id }
        }
        this.adapterPresenter.emit("adapterStatus", this.adapterStatus)
    }

    async runOnce(runOptions?: AdapterRunOptions): Promise<AdapterStatusSummary> {
        if (this.adapterStatus.statusSummary)
            throw new Error("Run once")

        this.adapterStatus.statusSummary = {
            output_rows: 0,
            rows_success: 0,
            rows_failed: 0,
            rows_invalid: 0,
            rows_skipped: 0,
        };
        this.adapterStatus.runOptions = runOptions || null;

        const inputRegisters = await this.inputRegisters(runOptions);
        const outputRegisters = await this.outputRegisters(inputRegisters, runOptions);

        this.adapterStatus.statusSummary = calculateSummary(outputRegisters);
        this.adapterPresenter.emit("adapterStatus", this.adapterStatus)
        return this.adapterStatus.statusSummary;
    }

    private async inputRegisters(runOptions?: AdapterRunOptions): Promise<Register<Entity>[]> {
        let inputRegisters = [];

        if (runOptions?.mockEntities) {
            const inputEntities = runOptions?.mockEntities || [];
            const inputEntitiesWithMeta = getWithMetaFormat(inputEntities)
            inputRegisters = await this.initRegisters(inputEntitiesWithMeta)
        }
        else if (runOptions?.onlyFailedEntities) {
            const outputRegisters = await this.registerDataAccess.getAll({
                registerType: this.adapterDefinition.outputType,
                registerStatus: RegisterStatusTag.failed,
                ...this.syncUpperContext
            })
            const inputRegistersIds = outputRegisters.map(outputRegister => outputRegister.sourceRelativeId) as string[]
            inputRegisters = await this.registerDataAccess.getAll(undefined, inputRegistersIds)
        }
        else {
            inputRegisters = await this.getRegisters()
        }

        return inputRegisters;
    }

    protected async initRegisters(inputEntities: EntityWithMeta<Entity>[]): Promise<Register<Entity>[]> {
        return inputEntities.map(inputEntity => {
            const inputEntityId = uuidv4();
            return {
                id: inputEntityId,
                entityType: "Mocked",
                sourceAbsoluteId: inputEntityId,
                sourceRelativeId: inputEntityId,
                statusTag: RegisterStatusTag.success,
                statusMeta: null,
                entity: inputEntity.entity,
                meta: inputEntity.meta,
                context: this.adapterStatus.syncContext,
            }
        })
    }

    protected abstract getRegisters(): Promise<Register<Entity>[]>

    protected abstract outputRegisters(inputRegisters: Register<Entity>[], runOptions?: AdapterRunOptions): Promise<Register<Entity>[]>

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

    async outputRegisters(inputRegisters: Register<Entity>[], runOptions?: AdapterRunOptions) {
        await this.validateRegisters(inputRegisters);
        await this.fixRegisters(inputRegisters);
        const outputRegisters = inputRegisters;
        await this.registerDataAccess.saveAll(outputRegisters)
        return outputRegisters
    }

    protected async getRegisters(): Promise<Register<Entity>[]> {
        const inputEntities = await this.adapterDefinition.entitiesGet();
        const inputEntitiesWithMeta = getWithMetaFormat(inputEntities)
        const registers = await this.initRegisters(inputEntitiesWithMeta);
        return registers;
    }

    protected async initRegisters(inputEntities: EntityWithMeta<Entity>[]) {
        const registers = []
        for (let inputEntity of inputEntities) {
            const inputEntityId = uuidv4();
            const register: Register<Entity> = {
                id: inputEntityId,
                entityType: this.adapterDefinition.outputType,
                sourceAbsoluteId: inputEntityId,
                sourceRelativeId: inputEntityId,
                statusTag: RegisterStatusTag.pending,
                statusMeta: null,
                entity: inputEntity.entity,
                meta: inputEntity.meta,
                context: this.adapterStatus.syncContext
            }
            registers.push(register)
        }
        return registers
    }

    private async validateRegisters(inputRegisters: Register<Entity>[]) {
        for (const register of inputRegisters) {
            try {
                const result: any = await this.adapterDefinition.entityValidate(register.entity);
                let validationStatusTag;
                let validationMeta;
                if (result.statusTag && result.meta) {
                    validationStatusTag = result.statusTag;
                    validationMeta = result.meta;
                } else {
                    validationStatusTag = result;
                    validationMeta = null;
                }

                if (validationStatusTag == ValidationStatusTag.invalid) {
                    register.statusTag = RegisterStatusTag.invalid;
                }

                else if (validationStatusTag == ValidationStatusTag.skipped) {
                    register.statusTag = RegisterStatusTag.skipped;
                }

                else if (validationStatusTag == ValidationStatusTag.valid) {
                    register.statusTag = RegisterStatusTag.success;
                }

                register.statusMeta = validationMeta;

            } catch (error: any) {
                register.statusTag = RegisterStatusTag.failed;
                register.statusMeta = error.message;
            }
        }
    }

    private async fixRegisters(inputRegisters: Register<Entity>[]) {
        const toFixRegisters = inputRegisters.filter(register => register.statusTag == RegisterStatusTag.invalid);
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
    abstract readonly entitiesGet: () => Promise<(EntityWithMeta<input> | null | input)[]>
    abstract readonly entityValidate: (inputEntity: input | null) => Promise<ValidationResult | ValidationStatusTag> //data quality, error handling (error prevention), managin Bad Data-> triage or CleanUp
    abstract readonly entityFix: (toFixEntity: ToFixEntity<input>) => Promise<FixedEntity<input> | null> //error handling (error response), managin Bad Data-> CleanUp
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

    async outputRegisters(inputRegisters: Register<Entity>[], runOptions?: AdapterRunOptions) {
        const outputRegisters = await this.processRegisters(inputRegisters);
        await this.registerDataAccess.saveAll(outputRegisters)
        return outputRegisters
    }

    protected async getRegisters(): Promise<Register<Entity>[]> {
        const inputRegisters = await this.registerDataAccess.getAll({
            registerType: this.adapterDefinition.inputType,
            registerStatus: RegisterStatusTag.success,
            flowId: this.adapterStatus.syncContext.flowId
        })
        return inputRegisters
    }

    private async processRegisters(inputRegisters: Register<Entity>[]): Promise<Register<Entity>[]> {
        const outputRegisters = [];
        for (const inputRegistry of inputRegisters) {
            try {
                const inputEntity = inputRegistry.entity as Entity;
                const outputEntity = await this.adapterDefinition.entityProcess(inputEntity);
                const register: Register<Entity> = {
                    id: uuidv4(),
                    entityType: this.adapterDefinition.outputType,
                    sourceAbsoluteId: inputRegistry.sourceRelativeId,
                    sourceRelativeId: inputRegistry.id,
                    statusTag: RegisterStatusTag.success,
                    statusMeta: undefined,
                    entity: outputEntity,
                    meta: undefined,
                    context: this.adapterStatus.syncContext
                }
                outputRegisters.push(register)
            } catch (error: any) {
                const register: Register<Entity> = {
                    id: uuidv4(),
                    entityType: this.adapterDefinition.outputType,
                    sourceAbsoluteId: inputRegistry.sourceRelativeId,
                    sourceRelativeId: inputRegistry.id,
                    statusTag: RegisterStatusTag.failed,
                    statusMeta: error.message,
                    entity: null,
                    meta: undefined,
                    context: this.adapterStatus.syncContext
                }
                outputRegisters.push(register)
            }
        }
        return outputRegisters;
    }

}

export abstract class MyAdapterTransformerDefinition<input extends Entity, output extends Entity> implements AdapterDefinition {
    abstract readonly id: string;
    abstract readonly inputType: string
    abstract readonly outputType: string
    abstract readonly definitionType: string;
    abstract readonly entityProcess: (entity: input) => Promise<output>
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

    async outputRegisters(inputRegisters: Register<Entity>[], runOptions?: AdapterRunOptions) {
        const ouputRegisters = await this.loadAndSaveRegisters(inputRegisters);
        return ouputRegisters
    }

    protected async getRegisters(): Promise<Register<Entity>[]> {
        const inputRegisters = await this.registerDataAccess.getAll({
            registerType: this.adapterDefinition.inputType,
            registerStatus: RegisterStatusTag.success,
            flowId: this.adapterStatus.syncContext.flowId
        })
        return inputRegisters
    }

    private async loadAndSaveRegisters(inputRegisters: Register<Entity>[]) {
        const outputRegisters = [];
        for (const inputRegistry of inputRegisters) {
            try {
                const inputEntity = inputRegistry.entity;
                const outputEntity = await this.adapterDefinition.entityLoad(inputEntity);
                const register: Register<Entity> = {
                    // id: await this.adapterDefinition.generateID(outputEntity),
                    id: uuidv4(),
                    entityType: this.adapterDefinition.outputType,
                    sourceAbsoluteId: inputRegistry.sourceRelativeId,
                    sourceRelativeId: inputRegistry.id,
                    statusTag: RegisterStatusTag.success,
                    statusMeta: undefined,
                    entity: outputEntity,
                    meta: undefined,
                    context: this.adapterStatus.syncContext
                }
                outputRegisters.push(register)
                await this.registerDataAccess.save(register)
            } catch (error: any) {
                const register: Register<Entity> = {
                    id: uuidv4(),
                    entityType: this.adapterDefinition.outputType,
                    sourceAbsoluteId: inputRegistry.sourceRelativeId,
                    sourceRelativeId: inputRegistry.id,
                    statusTag: RegisterStatusTag.failed,
                    statusMeta: error.message,
                    entity: null,
                    meta: undefined,
                    context: this.adapterStatus.syncContext
                }
                outputRegisters.push(register)
                await this.registerDataAccess.save(register)
            }
        }
        return outputRegisters;
    }
}

export abstract class MyAdapterLoaderDefinition<input extends Entity, output extends Entity> implements AdapterDefinition {
    abstract readonly id: string;
    abstract readonly inputType: string
    abstract readonly outputType: string
    abstract readonly definitionType: string;
    abstract readonly entityLoad: (entity: input | null) => Promise<output>
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

    async outputRegisters(inputRegisters: Register<Entity>[], runOptions?: AdapterRunOptions) {
        const outputRegisters = inputRegisters;
        await this.registerDataAccess.saveAll(outputRegisters)
        return outputRegisters
    }

    protected async getRegisters(): Promise<Register<Entity>[]> {
        const inputEntities = await this.adapterDefinition.entitiesGet(this.registerDataAccess, this.adapterStatus.syncContext);
        const inputEntitiesWithMeta = getWithMetaFormat(inputEntities)
        const registers = await this.initRegisters(inputEntitiesWithMeta);
        return registers;
    }

    protected async initRegisters(inputEntities: EntityWithMeta<Entity>[]) {
        const registers = []
        for (let inputEntity of inputEntities) {
            const inputEntityId = uuidv4();
            const register: Register<Entity> = {
                id: inputEntityId,
                entityType: this.adapterDefinition.outputType,
                sourceAbsoluteId: inputEntityId,
                sourceRelativeId: inputEntityId,
                statusTag: RegisterStatusTag.success,
                statusMeta: null,
                entity: inputEntity.entity,
                meta: inputEntity.meta,
                context: this.adapterStatus.syncContext
            }
            registers.push(register)
        }
        return registers
    }
}

export abstract class MyAdapterFlexDefinition<output extends Entity> implements AdapterDefinition {
    abstract readonly id: string;
    abstract readonly outputType: string
    abstract readonly definitionType: string;
    abstract readonly entitiesGet: (registerDataAccess: RegisterDataAccess<Entity>, syncContext: RegisterDataContext) => Promise<output[]>
}
