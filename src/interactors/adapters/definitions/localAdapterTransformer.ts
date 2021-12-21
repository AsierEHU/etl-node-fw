import { Register, RegisterStatusTag, SyncContext } from "../../registers/types";
import { AdapterDefinition, AdapterRunOptions } from "../types"
import { v4 as uuidv4 } from 'uuid';
import { LocalAdapter } from "./localAdapter";


/**
 * Local async step, persistance
 * row-by-row
 * 1 input 1 output
 */
export class LocalAdapterTransformer<ad extends LocalAdapterTransformerDefinition<any, any>> extends LocalAdapter<ad>{

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
        const outputRegisters = await this.transformRegisters(inputRegisters, runOptions);
        await this.registerDataAccess.saveAll(outputRegisters)
    }

    private async transformRegisters(inputRegisters: Register[], runOptions: AdapterRunOptions): Promise<Register[]> {
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
                    syncContext: runOptions.syncContext
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
                    syncContext: runOptions.syncContext
                }
                outputRegisters.push(register)
            }
        }
        return outputRegisters;
    }

}

export abstract class LocalAdapterTransformerDefinition<input, output> implements AdapterDefinition {
    abstract readonly id: string;
    abstract readonly inputType: string
    abstract readonly outputType: string
    abstract readonly definitionType: string;
    abstract readonly entityProcess: (entity: input) => Promise<output>
}
