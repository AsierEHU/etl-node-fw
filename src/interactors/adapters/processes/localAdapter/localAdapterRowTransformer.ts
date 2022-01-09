import { SyncContext, Register, RegisterStatusTag } from "../../../registers/types";
import { LocalAdapter } from "./localAdapter";
import { v4 as uuidv4 } from 'uuid';
import { LocalAdapterTransformerRowDefinition } from "../../definitions/localAdapter/types";

export class LocalAdapterRowTransformer<ad extends LocalAdapterTransformerRowDefinition<any, any>> extends LocalAdapter<ad>{

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
        const outputRegisters = await this.transformRegisters(inputRegisters, syncContext);
        await this.registerDataAccess.saveAll(outputRegisters)
    }

    private async transformRegisters(inputRegisters: Register[], syncContext: SyncContext): Promise<Register[]> {
        const outputRegisters = [];
        for (const inputRegister of inputRegisters) {
            try {
                const inputEntity = inputRegister.entity;
                const outputEntity = await this.adapterDefinition.entityProcess(inputEntity);
                const register: Register = {
                    id: uuidv4(),
                    entityType: this.adapterDefinition.outputType,
                    sourceAbsoluteId: inputRegister.sourceAbsoluteId,
                    sourceRelativeId: inputRegister.id,
                    sourceEntityId: inputRegister.sourceEntityId,
                    statusTag: RegisterStatusTag.success,
                    statusMeta: null,
                    entity: outputEntity,
                    meta: null,
                    date: new Date(),
                    definitionId: this.adapterDefinition.id,
                    syncContext
                }
                outputRegisters.push(register)
            } catch (error: any) {
                const register: Register = {
                    id: uuidv4(),
                    entityType: this.adapterDefinition.outputType,
                    sourceAbsoluteId: inputRegister.sourceAbsoluteId,
                    sourceRelativeId: inputRegister.id,
                    sourceEntityId: inputRegister.sourceEntityId,
                    statusTag: RegisterStatusTag.failed,
                    statusMeta: error.message,
                    entity: null,
                    meta: null,
                    date: new Date(),
                    definitionId: this.adapterDefinition.id,
                    syncContext
                }
                outputRegisters.push(register)
            }
        }
        return outputRegisters;
    }

}
