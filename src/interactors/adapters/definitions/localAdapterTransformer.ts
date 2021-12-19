import { Entity, Register, RegisterStatusTag, SyncContext } from "../../registers/types";
import { AdapterDefinition, AdapterRunOptions } from "../types"
import { v4 as uuidv4 } from 'uuid';
import { LocalAdapter } from "./localAdapter";


/**
 * Local async step, persistance
 * row-by-row
 * 1 input 1 output
 */
export class LocalAdapterTransformer<ad extends LocalAdapterTransformerDefinition<Entity, Entity>> extends LocalAdapter<ad>{

    constructor(dependencies: any) {
        super(dependencies)
    }

    protected async getRegisters(syncContext: SyncContext): Promise<Register<Entity>[]> {
        const inputRegisters = await this.registerDataAccess.getAll({
            registerType: this.adapterDefinition.inputType,
            registerStatus: RegisterStatusTag.success,
            flowId: syncContext.flowId
        })
        return inputRegisters
    }

    async outputRegisters(inputRegisters: Register<Entity>[], runOptions: AdapterRunOptions) {
        const outputRegisters = await this.processRegisters(inputRegisters, runOptions);
        await this.registerDataAccess.saveAll(outputRegisters)
    }

    private async processRegisters(inputRegisters: Register<Entity>[], runOptions: AdapterRunOptions): Promise<Register<Entity>[]> {
        const outputRegisters = [];
        for (const inputRegister of inputRegisters) {
            try {
                const inputEntity = inputRegister.entity as Entity;
                const outputEntity = await this.adapterDefinition.entityProcess(inputEntity);
                const register: Register<Entity> = {
                    id: uuidv4(),
                    entityType: this.adapterDefinition.outputType,
                    sourceAbsoluteId: inputRegister.sourceAbsoluteId,
                    sourceRelativeId: inputRegister.id,
                    statusTag: RegisterStatusTag.success,
                    statusMeta: null,
                    entity: outputEntity,
                    meta: null,
                    syncContext: runOptions.syncContext
                }
                outputRegisters.push(register)
            } catch (error: any) {
                const register: Register<Entity> = {
                    id: uuidv4(),
                    entityType: this.adapterDefinition.outputType,
                    sourceAbsoluteId: inputRegister.sourceAbsoluteId,
                    sourceRelativeId: inputRegister.id,
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

export abstract class LocalAdapterTransformerDefinition<input extends Entity, output extends Entity> implements AdapterDefinition {
    abstract readonly id: string;
    abstract readonly inputType: string
    abstract readonly outputType: string
    abstract readonly definitionType: string;
    abstract readonly entityProcess: (entity: input) => Promise<output>
}
