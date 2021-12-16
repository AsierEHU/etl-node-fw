
import { Entity, Register, RegisterStatusTag } from "../../registers/types";
import { AdapterDefinition, InputEntity } from "../types"
import { FixedEntity, ToFixEntity, ValidationResult, ValidationStatusTag } from "./types";
import { getValidationResultWithMeta, getWithMetaFormat, validationTagToRegisterTag } from "./utils";
import { LocalAdapter } from "./localAdapter";


/**
 * Local async step, persistance
 * row-by-row
 * 1 input 1 output
 */
export class LocalAdapterExtractor<ad extends LocalAdapterExtractorDefinition<Entity>> extends LocalAdapter<ad>{

    constructor(dependencies: any) {
        super(dependencies)
    }

    protected async getRegisters(): Promise<Register<Entity>[]> {
        const inputEntities = await this.adapterDefinition.entitiesGet();
        const inputEntitiesWithMeta = getWithMetaFormat(inputEntities)
        const registers = await this.initRegisters(inputEntitiesWithMeta);
        return registers;
    }

    async outputRegisters(inputRegisters: Register<Entity>[]) {
        await this.validateRegisters(inputRegisters);
        await this.fixRegisters(inputRegisters);
        const outputRegisters = inputRegisters;
        await this.registerDataAccess.saveAll(outputRegisters)
        return outputRegisters
    }

    private async validateRegisters(inputRegisters: Register<Entity>[]) {
        for (const register of inputRegisters) {
            try {
                const validation = await this.adapterDefinition.entityValidate(register.entity);
                const validationWithMeta = getValidationResultWithMeta(validation);
                register.statusTag = validationTagToRegisterTag(validationWithMeta.statusTag)
                register.statusMeta = validationWithMeta.meta;
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
                    toFixRegister.statusMeta = fixedEntity.meta
                } else {
                    toFixRegister.statusTag = RegisterStatusTag.invalid;
                }

            } catch (error) {
                toFixRegister.statusTag = RegisterStatusTag.invalid;
            }
        }
    }

}

export abstract class LocalAdapterExtractorDefinition<output extends Entity> implements AdapterDefinition {
    abstract readonly definitionType: string;
    abstract readonly id: string;
    abstract readonly outputType: string
    abstract readonly entitiesGet: () => Promise<InputEntity<output>[]>
    abstract readonly entityValidate: (inputEntity: output | null) => Promise<ValidationResult | ValidationStatusTag> //data quality, error handling (error prevention), managin Bad Data-> triage or CleanUp
    abstract readonly entityFix: (toFixEntity: ToFixEntity<output>) => Promise<FixedEntity<output> | null> //error handling (error response), managin Bad Data-> CleanUp
}
