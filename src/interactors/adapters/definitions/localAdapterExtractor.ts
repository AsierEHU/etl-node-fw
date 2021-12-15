
import { Entity, Register, RegisterStatusTag } from "../../registers/types";
import { AdapterDefinition, EntityWithMeta, InputEntity } from "../types"
import { v4 as uuidv4 } from 'uuid';
import { FixedEntity, ToFixEntity, ValidationResult, ValidationStatusTag } from "./types";
import { getValidationResultWithMeta, getWithMetaFormat } from "./utils";
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
                syncContext: this.adapterStatus.syncContext
            }
            registers.push(register)
        }
        return registers
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

                if (validationWithMeta.statusTag == ValidationStatusTag.invalid) {
                    register.statusTag = RegisterStatusTag.invalid;
                }

                else if (validationWithMeta.statusTag == ValidationStatusTag.skipped) {
                    register.statusTag = RegisterStatusTag.skipped;
                }

                else if (validationWithMeta.statusTag == ValidationStatusTag.valid) {
                    register.statusTag = RegisterStatusTag.success;
                }

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
