
import { Entity, Register, RegisterStatusTag } from "../../registers/types";
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

    async outputRegisters(inputRegisters: Register<Entity>[]) {
        const outputRegisters = await this.processRegisters(inputRegisters);
        await this.registerDataAccess.saveAll(outputRegisters)
        return outputRegisters
    }

    protected async getRegisters(): Promise<Register<Entity>[]> {
        const inputRegisters = await this.registerDataAccess.getAll({
            registerType: this.adapterDefinition.inputType,
            registerStatus: RegisterStatusTag.success,
            flowId: this.adapterStatus.syncContext.flowId
        })
        return inputRegisters
    }

    private async processRegisters(inputRegisters: Register<Entity>[]): Promise<Register<Entity>[]> {
        const outputRegisters = [];
        for (const inputRegistry of inputRegisters) {
            try {
                const inputEntity = inputRegistry.entity as Entity;
                const outputEntity = await this.adapterDefinition.entityProcess(inputEntity);
                const register: Register<Entity> = {
                    id: uuidv4(),
                    entityType: this.adapterDefinition.outputType,
                    sourceAbsoluteId: inputRegistry.sourceRelativeId,
                    sourceRelativeId: inputRegistry.id,
                    statusTag: RegisterStatusTag.success,
                    statusMeta: undefined,
                    entity: outputEntity,
                    meta: undefined,
                    syncContext: this.adapterStatus.syncContext
                }
                outputRegisters.push(register)
            } catch (error: any) {
                const register: Register<Entity> = {
                    id: uuidv4(),
                    entityType: this.adapterDefinition.outputType,
                    sourceAbsoluteId: inputRegistry.sourceRelativeId,
                    sourceRelativeId: inputRegistry.id,
                    statusTag: RegisterStatusTag.failed,
                    statusMeta: error.message,
                    entity: null,
                    meta: undefined,
                    syncContext: this.adapterStatus.syncContext
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
