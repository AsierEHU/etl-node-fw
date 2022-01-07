import { SyncContext, Register, RegisterStatusTag, InputEntity } from "../../../registers/types";
import { getWithMetaFormat } from "../../../registers/utils";
import { LocalAdapter } from "./localAdapter";
import { getValidationResultWithMeta, validationTagToRegisterTag } from "./utils";
import { v4 as uuidv4 } from 'uuid';
import { LocalAdapterLoaderDefinition } from "../../definitions/localAdapter/types";

export class LocalAdapterLoader<ad extends LocalAdapterLoaderDefinition<any, any>> extends LocalAdapter<ad>{

    constructor(dependencies: any) {
        super(dependencies)
    }

    protected async getRegisters(syncContext: SyncContext): Promise<Register[]> {
        const inputRegisters = await this.registerDataAccess.getAll({
            entityType: this.adapterDefinition.inputType,
            registerStatus: RegisterStatusTag.success,
            flowId: syncContext.flowId
        })
        return inputRegisters
    }

    async processRegisters(inputRegisters: Register[], syncContext: SyncContext) {
        const outputRegisters = [];
        for (const inputRegister of inputRegisters) {
            const outputRegister = await this.loadRegister(inputRegister, syncContext)
            const outputValidatedRegister = await this.validateRegister(outputRegister)
            await this.registerDataAccess.save(outputValidatedRegister)
            outputRegisters.push(outputValidatedRegister)
        }
    }

    private async loadRegister(inputRegister: Register, syncContext: SyncContext): Promise<Register> {
        try {
            const inputEntity = inputRegister.entity;
            const outputEntity = await this.adapterDefinition.entityLoad(inputEntity);
            const [outputEntityWithMeta] = getWithMetaFormat([outputEntity])
            const register: Register = {
                id: uuidv4(),
                entityType: this.adapterDefinition.outputType,
                sourceAbsoluteId: inputRegister.sourceRelativeId,
                sourceRelativeId: inputRegister.id,
                sourceEntityId: inputRegister.sourceEntityId,
                statusTag: RegisterStatusTag.pending,
                statusMeta: null,
                entity: outputEntityWithMeta.$entity,
                meta: outputEntityWithMeta.$meta || null,
                syncContext
            }
            return register
        } catch (error: any) {
            const register: Register = {
                id: uuidv4(),
                entityType: this.adapterDefinition.outputType,
                sourceAbsoluteId: inputRegister.sourceRelativeId,
                sourceRelativeId: inputRegister.id,
                sourceEntityId: inputRegister.sourceEntityId,
                statusTag: RegisterStatusTag.failed,
                statusMeta: error.message,
                entity: null,
                meta: null,
                syncContext
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
