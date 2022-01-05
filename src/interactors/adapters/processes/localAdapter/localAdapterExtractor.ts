import { SyncContext, Register, RegisterStatusTag, InputEntity, reservedRegisterEntityTypes } from "../../../registers/types";
import { getWithInitFormat, initRegisters } from "../../../registers/utils";
import { AdapterDefinition } from "../types";
import { LocalAdapter } from "./localAdapter";
import { ValidationResult, ValidationStatusTag, ToFixEntity, FixedEntity } from "./types";
import { getValidationResultWithMeta, validationTagToRegisterTag } from "./utils";


/**
 * Local async step, persistance
 * row-by-row
 * 1 input 1 output
 */
export class LocalAdapterExtractor<ad extends LocalAdapterExtractorDefinition<any>> extends LocalAdapter<ad>{

    constructor(dependencies: any) {
        super(dependencies)
    }

    protected async getRegisters(syncContext: SyncContext): Promise<Register[]> {
        const configPushedRegisters = await this.registerDataAccess.getAll({
            registerType: reservedRegisterEntityTypes.extractorConfig,
            flowId: syncContext.flowId
        })
        const configPushedEntity = configPushedRegisters[0]?.entity
        //TODO: Use entityFetcher. Add to entity fetcher a custom method for the "configPushed" type.
        const inputEntities = await this.adapterDefinition.entitiesGet(configPushedEntity);
        const inputEntitiesInitialValues = getWithInitFormat(inputEntities, this.adapterDefinition.outputType)
        const registers = initRegisters(inputEntitiesInitialValues, syncContext);
        return registers;
    }

    async processRegisters(outputRegisters: Register[]) {
        await this.validateRegisters(outputRegisters);
        await this.fixRegisters(outputRegisters);
        await this.registerDataAccess.saveAll(outputRegisters)
    }

    private async validateRegisters(outputRegisters: Register[]) {
        for (const register of outputRegisters) {
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

    private async fixRegisters(outputRegisters: Register[]) {
        const toFixRegisters = outputRegisters.filter(register => register.statusTag == RegisterStatusTag.invalid);
        for (const toFixRegister of toFixRegisters) {
            try {
                const toFixEntity = {
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

            } catch (error: any) {
                toFixRegister.statusTag = RegisterStatusTag.failed;
                toFixRegister.statusMeta = error.message;
            }
        }
    }

}

export abstract class LocalAdapterExtractorDefinition<output extends object> implements AdapterDefinition {
    abstract readonly definitionType: string;
    abstract readonly id: string;
    abstract readonly outputType: string
    abstract readonly entitiesGet: (configPushed?: any) => Promise<InputEntity<output>[]>
    abstract readonly entityValidate: (inputEntity: output | null) => Promise<ValidationResult | ValidationStatusTag> //data quality, error handling (error prevention), managin Bad Data-> triage or CleanUp
    abstract readonly entityFix: (toFixEntity: ToFixEntity<output>) => Promise<FixedEntity<output> | null> //error handling (error response), managin Bad Data-> CleanUp
}
