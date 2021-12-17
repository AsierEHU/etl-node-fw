
import { Entity, Register, RegisterStatusTag } from "../../registers/types";
import { AdapterDefinition, RegisterDataFilter } from "../types"
import { getValidationResultWithMeta, getWithMetaFormat, ContextEntityFetcher, validationTagToRegisterTag } from "./utils";
import { LocalAdapter } from "./localAdapter";
import { EntityFetcher, ValidationResult, ValidationStatusTag } from "./types";

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
        const entityFetcher = new ContextEntityFetcher(
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
        await this.validateRegisters(inputRegisters);
        const outputRegisters = inputRegisters;
        await this.registerDataAccess.saveAll(outputRegisters)
        return outputRegisters
    }

    private async validateRegisters(inputRegisters: Register<Entity>[]) {
        for (const register of inputRegisters) {
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
}

export abstract class LocalAdapterFlexDefinition<output extends Entity> implements AdapterDefinition {
    abstract readonly id: string;
    abstract readonly outputType: string
    abstract readonly definitionType: string;
    abstract readonly entitiesGet: (entityFetcher: EntityFetcher) => Promise<output[]>
    abstract readonly entityValidate: (outputEntity: output | null) => Promise<ValidationResult | ValidationStatusTag> //data quality, error handling (error prevention), managin Bad Data-> triage or CleanUp
}

