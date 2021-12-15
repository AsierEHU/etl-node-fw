
import { Entity, Register, RegisterDataContext, RegisterStatusTag } from "../../registers/types";
import { AdapterDefinition, EntityWithMeta } from "../types"
import { v4 as uuidv4 } from 'uuid';
import { RegisterDataAccess } from "./types";
import { getWithMetaFormat } from "./utils";
import { LocalAdapter } from "./localAdapter";

/**
 * Local async step, persistance
 * row-by-row
 * unknown input 1 output
 */
export class LocalAdapterFlex<ad extends LocalAdapterFlexDefinition<Entity>> extends LocalAdapter<ad>{

    constructor(dependencies: any) {
        super(dependencies)
    }

    async outputRegisters(inputRegisters: Register<Entity>[]) {
        const outputRegisters = inputRegisters;
        await this.registerDataAccess.saveAll(outputRegisters)
        return outputRegisters
    }

    protected async getRegisters(): Promise<Register<Entity>[]> {
        const inputEntities = await this.adapterDefinition.entitiesGet(this.registerDataAccess, this.adapterStatus.syncContext);
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
                statusTag: RegisterStatusTag.success,
                statusMeta: null,
                entity: inputEntity.entity,
                meta: inputEntity.meta,
                syncContext: this.adapterStatus.syncContext
            }
            registers.push(register)
        }
        return registers
    }
}

export abstract class LocalAdapterFlexDefinition<output extends Entity> implements AdapterDefinition {
    abstract readonly id: string;
    abstract readonly outputType: string
    abstract readonly definitionType: string;
    abstract readonly entitiesGet: (registerDataAccess: RegisterDataAccess<Entity>, syncContext: RegisterDataContext) => Promise<output[]>
}
