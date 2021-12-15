
import { Entity, Register, RegisterStatusTag } from "../../registers/types";
import { AdapterDefinition, EntityWithMeta } from "../types"
import { v4 as uuidv4 } from 'uuid';
import { getWithMetaFormat } from "./utils";
import { LocalAdapter } from "./localAdapter";
import { VolatileEntityFetcher } from "../../../dataAccess/volatile";
import { EntityFetcher, RegisterDataFilter } from "./types";

/**
 * Local async step, persistance
 * row-by-row
 * unknown input 1 output
 */
export class LocalAdapterFlex<ad extends LocalAdapterFlexDefinition<Entity>> extends LocalAdapter<ad>{

    constructor(dependencies: any) {
        super(dependencies)
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

    async outputRegisters(inputRegisters: Register<Entity>[]) {
        const outputRegisters = inputRegisters;
        await this.registerDataAccess.saveAll(outputRegisters)
        return outputRegisters
    }

    protected async getRegisters(): Promise<Register<Entity>[]> {
        const entityFetcher = new VolatileEntityFetcher(
            { flowId: this.adapterStatus.syncContext.flowId },
            this.registerDataAccess
        )
        const inputEntities = await this.adapterDefinition.entitiesGet(entityFetcher);
        const inputEntitiesWithMeta = getWithMetaFormat(inputEntities)
        const registers = await this.initRegisters(inputEntitiesWithMeta);
        this.calculateSourceId(registers, entityFetcher.getHistory())
        return registers;
    }

    private calculateSourceId(registers: Register<Entity>[], history: RegisterDataFilter[]) {

        const sourceId = history.reduce((id, curr) => {
            return id + "-" + curr.registerType + "_" + curr.registerStatus
        }, "00000000")

        if (sourceId != "00000000")
            for (const register of registers) {
                register.sourceRelativeId = sourceId
                register.sourceAbsoluteId = sourceId
            }
    }
}

export abstract class LocalAdapterFlexDefinition<output extends Entity> implements AdapterDefinition {
    abstract readonly id: string;
    abstract readonly outputType: string
    abstract readonly definitionType: string;
    abstract readonly entitiesGet: (entityFetcher: EntityFetcher) => Promise<output[]>
}

