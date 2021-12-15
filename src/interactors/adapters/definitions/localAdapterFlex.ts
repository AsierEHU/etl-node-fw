
import { Entity, Register, RegisterStatusTag } from "../../registers/types";
import { AdapterDefinition } from "../types"
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

    async outputRegisters(inputRegisters: Register<Entity>[]) {
        const outputRegisters = inputRegisters;
        outputRegisters.forEach(register => {
            register.statusTag = RegisterStatusTag.success
        })
        await this.registerDataAccess.saveAll(outputRegisters)
        return outputRegisters
    }
}

export abstract class LocalAdapterFlexDefinition<output extends Entity> implements AdapterDefinition {
    abstract readonly id: string;
    abstract readonly outputType: string
    abstract readonly definitionType: string;
    abstract readonly entitiesGet: (entityFetcher: EntityFetcher) => Promise<output[]>
}

