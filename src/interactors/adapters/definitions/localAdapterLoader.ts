
import { Entity, Register, RegisterStatusTag } from "../../registers/types";
import { AdapterDefinition, EntityWithMeta } from "../types"
import { v4 as uuidv4 } from 'uuid';
import { LocalAdapter } from "./localAdapter";
import { getValidationResultWithMeta, getWithMetaFormat, validationTagToRegisterTag } from "./utils";
import { ValidationResult, ValidationStatusTag } from "./types";

/**
 * Local async step, persistance
 * row-by-row
 * 1 input 1 output
 */
export class LocalAdapterLoader<ad extends LocalAdapterLoaderDefinition<Entity, Entity>> extends LocalAdapter<ad>{

    constructor(dependencies: any) {
        super(dependencies)
    }

    protected async getRegisters(): Promise<Register<Entity>[]> {
        const inputRegisters = await this.registerDataAccess.getAll({
            registerType: this.adapterDefinition.inputType,
            registerStatus: RegisterStatusTag.success,
            flowId: this.adapterStatus.syncContext.flowId
        })
        return inputRegisters
    }

    async outputRegisters(inputRegisters: Register<Entity>[]) {
        const outputRegisters = [];
        for (const inputRegister of inputRegisters) {
            const outputRegister = await this.loadRegister(inputRegister)
            const outputValidatedRegister = await this.validateRegister(outputRegister)
            await this.registerDataAccess.save(outputValidatedRegister)
            outputRegisters.push(outputValidatedRegister)
        }
        return outputRegisters
    }

    private async loadRegister(inputRegister: Register<Entity>): Promise<Register<object>> {
        try {
            const inputEntity = inputRegister.entity as Entity;
            const outputEntity = await this.adapterDefinition.entityLoad(inputEntity);
            const [outputEntityWithMeta] = getWithMetaFormat([outputEntity])
            const register: Register<Entity> = {
                id: uuidv4(),
                entityType: this.adapterDefinition.outputType,
                sourceAbsoluteId: inputRegister.sourceRelativeId,
                sourceRelativeId: inputRegister.id,
                statusTag: RegisterStatusTag.pending,
                statusMeta: null,
                entity: outputEntityWithMeta.entity,
                meta: outputEntityWithMeta.meta,
                syncContext: this.adapterStatus.syncContext
            }
            return register
        } catch (error: any) {
            const register: Register<Entity> = {
                id: uuidv4(),
                entityType: this.adapterDefinition.outputType,
                sourceAbsoluteId: inputRegister.sourceRelativeId,
                sourceRelativeId: inputRegister.id,
                statusTag: RegisterStatusTag.failed,
                statusMeta: error.message,
                entity: null,
                meta: null,
                syncContext: this.adapterStatus.syncContext
            }
            return register
        }
    }

    private async validateRegister(register: Register<Entity>): Promise<Register<object>> {
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

export abstract class LocalAdapterLoaderDefinition<input extends Entity, output extends Entity> implements AdapterDefinition {
    abstract readonly id: string;
    abstract readonly inputType: string
    abstract readonly outputType: string
    abstract readonly definitionType: string;
    abstract readonly entityLoad: (entity: input) => Promise<EntityWithMeta<output> | output>
    abstract readonly entityValidate: (outputEntity: output | null) => Promise<ValidationResult | ValidationStatusTag> //data quality, error handling (error prevention), managin Bad Data-> triage or CleanUp
}
