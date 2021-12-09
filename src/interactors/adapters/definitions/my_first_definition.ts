import { Register, RegisterDataAccess, RegisterStatusTag } from "../../registers/types";
import { Adapter, AdapterStatus, AdapterDefinition, InputEntity, AdapterStatusTag, AdapterRunOptions, AdapterStatusSummary } from "../types"


abstract class MyAdapter<ad extends AdapterDefinition> implements Adapter<ad>{

    protected readonly adapterDefinition: ad;
    protected readonly adapterRegisters: Register<any>[];
    // protected readonly adapterPersistance: AdapterPersistance;
    protected readonly registerDataAccess: RegisterDataAccess<any>;
    protected readonly adapterStatus: AdapterStatus


    constructor(dependencies: AdapterDependencies<ad>) {
        this.adapterRegisters = [];
        this.adapterDefinition = dependencies.adapterDefinition;
        // this.adapterPersistance = dependencies.adapterPersistance;
        this.registerDataAccess = dependencies.registerDataAccess;

        this.adapterStatus = {
            id: Math.random().toString(),
            meta: null,
            outputType: this.adapterDefinition.outputType,
            statusTag: AdapterStatusTag.notProcessed,
            summary: null,
        }
    }

    async start(runOptions?: AdapterRunOptions): Promise<AdapterStatusTag> {
        await this.run(runOptions);
        await this.saveRegisters();
        this.adapterStatus.summary = this.calculateSummary();
        this.adapterStatus.statusTag = this.calculateStatus(this.adapterStatus.summary)
        this.adapterStatus.meta = { runOptions }
        // await this.saveData();
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

    protected getMockedRegisters(inputEntities?: InputEntity<any>[]): Register<any>[] | null {

        if (!inputEntities)
            return null;

        return inputEntities.map(inputEntity => {
            return {
                id: Math.random().toString(),
                entityType: "Mocked",
                source_id: null,
                statusTag: null,
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
export class MyExtractorAdapter<ad extends MyAdapterExtractorDefinition<any>> extends MyAdapter<ad>{

    constructor(dependencies: any) {
        super(dependencies)
    }

    async run(runOptions?: AdapterRunOptions) {
        const inputEntities = runOptions?.mockEntities || (await this.adapterDefinition.entitiesGet(runOptions?.getOptions));
        await this.initRegisters(inputEntities);
        await this.validateRegisters();
        await this.fixRegisters();
    }

    private async initRegisters(inputEntities: InputEntity<any>[]) {
        for (const inputEntity of inputEntities) {
            // const inputEntityId = await this.adapterDefinition.generateID(inputEntity.entity)
            const inputEntityId = Math.random().toString();
            const adapterRegister: Register<any> = {
                id: inputEntityId,
                entityType: this.adapterDefinition.outputType,
                source_id: null,
                statusTag: null,
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

            } catch (e: any) {
                adapterRegister.statusTag = RegisterStatusTag.failed;
                adapterRegister.statusMeta = e.message;
            }
        }
    }

    private async fixRegisters() {
        const toFixRegisters = this.adapterRegisters.filter(register => register.statusTag == RegisterStatusTag.invalid);
        for (const toFixRegister of toFixRegisters) {
            try {
                const fixedEntity = await this.adapterDefinition.entityFix(toFixRegister.entity);
                if (fixedEntity) {
                    toFixRegister.entity = fixedEntity.entity;
                    toFixRegister.statusTag = RegisterStatusTag.success;
                    toFixRegister.statusMeta = fixedEntity.meta;
                } else {
                    toFixRegister.statusTag = RegisterStatusTag.invalid;
                }

            } catch (e) {
                toFixRegister.statusTag = RegisterStatusTag.invalid;
            }
        }
    }

}

export abstract class MyAdapterExtractorDefinition<input extends object> implements AdapterDefinition {
    abstract definitionType: string;
    abstract id: string;
    abstract outputType: string
    // generateID:(entity:input) => Promise<string | null>
    // getTrackFields: (entity:input) => Promise<string[]>
    abstract entitiesGet: (options: any) => Promise<InputEntity<input>[]>
    abstract entityValidate: (outputEntity: input) => Promise<ValidationResult> //data quality, error handling (error prevention), managin Bad Data-> triage or CleanUp
    abstract entityFix: (entity: ToFixEntity<input>) => Promise<FixedEntity<input> | null> //error handling (error response), managin Bad Data-> CleanUp
}


/**
 * Local async step, persistance
 * row-by-row
 * 1 input 1 output
 * TODO: Each row to be loaded requires something from one or more other rows in that same set of data (for example, determining order or grouping, or a running total)
 * TODO: The ETL process is an incremental load, but the volume of data is significant enough that doing a row-by-row comparison in the transformation step does not perform well
 * TOOD: Map reduce
 */
export class MyTransformerAdapter<ad extends MyAdapterTransformerDefinition<any, any>> extends MyAdapter<ad>{

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
                const adapterRegister: Register<any> = {
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
            } catch (e: any) {
                const adapterRegister: Register<any> = {
                    // id: inputRegistry.id,
                    id: Math.random().toString(),
                    entityType: this.adapterDefinition.outputType,
                    source_id: inputRegistry.id,
                    statusTag: RegisterStatusTag.failed,
                    statusMeta: e.message,
                    entity: null,
                    meta: undefined
                }
                this.adapterRegisters.push(adapterRegister)
            }
        }
    }

}

export abstract class MyAdapterTransformerDefinition<input extends object, output extends object> implements AdapterDefinition {
    // readonly version: string
    abstract id: string;
    abstract inputType: string
    abstract outputType: string
    abstract definitionType: string;
    // generateID:(entity:output) => Promise<string | null>
    // getTrackFields: (entity:output) => Promise<string[]>
    abstract entityProcess: (entity: input) => Promise<output> //first time (success), on retry (failed entities)
}


/**
 * Local async step, persistance
 * row-by-row
 * 1 input 1 output
 */
export class MyConsumerAdapter<ad extends MyAdapterConsumerDefinition<any, any>> extends MyAdapter<ad>{

    constructor(dependencies: any) {
        super(dependencies)
    }

    async run(runOptions?: AdapterRunOptions) {
        const inputRegisters =
            this.getMockedRegisters(runOptions?.mockEntities) ||
            (await this.registerDataAccess.getAll({ registerType: this.adapterDefinition.inputType }))
        await this.loadEntities(inputRegisters);
    }

    private async loadEntities(inputRegisters: Register<any>[]) {
        for (const inputRegistry of inputRegisters) {
            try {
                const inputEntity = inputRegistry.entity;
                const outputEntity = await this.adapterDefinition.entityLoad(inputEntity);
                const adapterRegister: Register<any> = {
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
            } catch (e) {
                const adapterRegister: Register<any> = {
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

export abstract class MyAdapterConsumerDefinition<input extends object, output extends object> implements AdapterDefinition {
    // readonly version: string
    abstract id: string;
    abstract inputType: string
    abstract outputType: string
    abstract definitionType: string;
    // generateID:(entity:output) => Promise<string | null>
    // getTrackFields: (entity:output) => Promise<string[]>
    abstract entityLoad: (entity: input) => Promise<output> //first time (success), on retry (failed entities)
}


/**
 * Local async step, persistance
 * row-by-row
 * unknown input 1 output
 */
export class MyFlexAdapter<ad extends MyAdapterFlexDefinition<any>> extends MyAdapter<ad>{

    constructor(dependencies: any) {
        super(dependencies)
    }

    async run(runOptions?: AdapterRunOptions) {
        const inputRegisters = this.getMockedRegisters(runOptions?.mockEntities) || (await this.adapterDefinition.registersGet(runOptions?.getOptions));
        await this.processEntities(inputRegisters);
    }

    private async processEntities(inputRegisters: Register<any>[]) {
        for (const inputRegistry of inputRegisters) {
            try {
                const inputEntity = inputRegistry.entity;
                const outputEntity = await this.adapterDefinition.entityProcess(inputEntity);
                const adapterRegister: Register<any> = {
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
            } catch (e: any) {
                const adapterRegister: Register<any> = {
                    id: Math.random().toString(),
                    entityType: this.adapterDefinition.outputType,
                    source_id: inputRegistry.id,
                    statusTag: RegisterStatusTag.failed,
                    statusMeta: e.message,
                    entity: null,
                    meta: undefined
                }
                this.adapterRegisters.push(adapterRegister)
            }
        }
    }

}

export abstract class MyAdapterFlexDefinition<output extends object> implements AdapterDefinition {
    // readonly version: string
    abstract id: string;
    abstract outputType: string
    abstract definitionType: string;
    // generateID:(entity:output) => Promise<string | null>
    // getTrackFields: (entity:output) => Promise<string[]>
    abstract registersGet: (options: any) => Promise<Register<any>[]>
    abstract entityProcess: (entity: any) => Promise<output> //first time (success), on retry (failed entities)
}





/**
 * Utils
 */

export type AdapterDependencies<ad extends AdapterDefinition> = {
    adapterDefinition: ad
    // adapterPersistance: AdapterPersistance
    registerDataAccess: RegisterDataAccess<any>
}

export interface AdapterPersistance {
    save: (AdapterStatus: AdapterStatus) => Promise<void>
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

export type ToFixEntity<input extends object> = {
    entity: input,
    validationResult: ValidationResult
}

export type FixedEntity<input extends object> = {
    entity: input,
    meta: any
}
