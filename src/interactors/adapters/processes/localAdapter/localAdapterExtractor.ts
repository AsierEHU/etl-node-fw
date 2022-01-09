import { SyncContext, Register, RegisterStatusTag } from "../../../registers/types";
import { getWithInitFormat, initRegisters } from "../../../registers/utils";
import { ContextEntityFetcher } from "../../../registers/utilsDB";
import { LocalAdapterExtractorDefinition } from "../../definitions/localAdapter/types";
import { LocalAdapter } from "./localAdapter";
import { getValidationResultWithMeta, validationTagToRegisterTag } from "./utils";

export class LocalAdapterExtractor<ad extends LocalAdapterExtractorDefinition<any>> extends LocalAdapter<ad>{

    constructor(dependencies: any) {
        super(dependencies)
    }

    protected async getRegisters(syncContext: SyncContext): Promise<Register[]> {
        const entityFetcher = new ContextEntityFetcher(
            { flowId: syncContext.flowId },
            this.registerDataAccess
        )
        const inputEntities = await this.adapterDefinition.entitiesGet(entityFetcher);
        const inputEntitiesInitialValues = getWithInitFormat(
            inputEntities,
            this.adapterDefinition.outputType,
            this.adapterDefinition.id
        )
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
