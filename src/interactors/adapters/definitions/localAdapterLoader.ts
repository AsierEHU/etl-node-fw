
import { EntityWithMeta, Register, RegisterStatusTag, SyncContext } from "../../registers/types";
import { AdapterDefinition, AdapterRunOptions, InputEntity } from "../types"
import { v4 as uuidv4 } from 'uuid';
import { LocalAdapter } from "./localAdapter";
import { getValidationResultWithMeta, validationTagToRegisterTag } from "./utils";
import { ValidationResult, ValidationStatusTag } from "./types";
import { getWithMetaFormat } from "../../registers/utils";

/**
 * Local async step, persistance
 * row-by-row
 * 1 input 1 output
 */
export class LocalAdapterLoader<ad extends LocalAdapterLoaderDefinition<any, any>> extends LocalAdapter<ad>{

    constructor(dependencies: any) {
        super(dependencies)
    }

    protected async getRegisters(syncContext: SyncContext): Promise<Register[]> {
        const inputRegisters = await this.registerDataAccess.getAll({
            registerType: this.adapterDefinition.inputType,
            registerStatus: RegisterStatusTag.success,
            flowId: syncContext.flowId
        })
        return inputRegisters
    }

    async processRegisters(inputRegisters: Register[], runOptions: AdapterRunOptions) {
        const outputRegisters = [];
        for (const inputRegister of inputRegisters) {
            const outputRegister = await this.loadRegister(inputRegister, runOptions)
            const outputValidatedRegister = await this.validateRegister(outputRegister)
            await this.registerDataAccess.save(outputValidatedRegister)
            outputRegisters.push(outputValidatedRegister)
        }
    }

    private async loadRegister(inputRegister: Register, runOptions: AdapterRunOptions): Promise<Register> {
        try {
            const inputEntity = inputRegister.entity;
            const outputEntity = await this.adapterDefinition.entityLoad(inputEntity);
            const [outputEntityWithMeta] = getWithMetaFormat([outputEntity])
            const register: Register = {
                id: uuidv4(),
                entityType: this.adapterDefinition.outputType,
                sourceAbsoluteId: inputRegister.sourceRelativeId,
                sourceRelativeId: inputRegister.id,
                statusTag: RegisterStatusTag.pending,
                statusMeta: null,
                entity: outputEntityWithMeta.entity,
                meta: outputEntityWithMeta.meta,
                syncContext: runOptions.syncContext
            }
            return register
        } catch (error: any) {
            const register: Register = {
                id: uuidv4(),
                entityType: this.adapterDefinition.outputType,
                sourceAbsoluteId: inputRegister.sourceRelativeId,
                sourceRelativeId: inputRegister.id,
                statusTag: RegisterStatusTag.failed,
                statusMeta: error.message,
                entity: null,
                meta: null,
                syncContext: runOptions.syncContext
            }
            return register
        }
    }

    private async validateRegister(register: Register): Promise<Register> {
        try {
            const validation = await this.adapterDefinition.entityValidate(register.entity);
            const validationWithMeta = getValidationResultWithMeta(validation);
            register.statusTag = validationTagToRegisterTag(validationWithMeta.statusTag)
            register.statusMeta = validationWithMeta.meta;
        } catch (error: any) {
            register.statusTag = RegisterStatusTag.failed;
            register.statusMeta = error.message;
        }
        return register;
    }
}

export abstract class LocalAdapterLoaderDefinition<input extends object, output extends object> implements AdapterDefinition {
    abstract readonly id: string;
    abstract readonly inputType: string
    abstract readonly outputType: string
    abstract readonly definitionType: string;
    abstract readonly entityLoad: (entity: input) => Promise<InputEntity<output>>
    abstract readonly entityValidate: (outputEntity: output | null) => Promise<ValidationResult | ValidationStatusTag> //data quality, error handling (error prevention), managin Bad Data-> triage or CleanUp
}
