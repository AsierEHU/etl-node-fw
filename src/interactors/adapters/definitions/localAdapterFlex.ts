
import { EntityFetcher, Register, RegisterDataFilter, RegisterStatusTag, SyncContext } from "../../registers/types";
import { AdapterDefinition, InputEntity } from "../types"
import { getValidationResultWithMeta, validationTagToRegisterTag } from "./utils";
import { LocalAdapter } from "./localAdapter";
import { ValidationResult, ValidationStatusTag } from "./types";
import { getWithInitFormat, initRegisters } from "../../registers/utils";
import { ContextEntityFetcher } from "../../../dataAccess/utils";

/**
 * Local async step, persistance
 * row-by-row
 * unknown input 1 output
 */
export class LocalAdapterFlex<ad extends LocalAdapterFlexDefinition<any>> extends LocalAdapter<ad>{

    constructor(dependencies: any) {
        super(dependencies)
    }

    protected async getRegisters(syncContext: SyncContext): Promise<Register[]> {
        const entityFetcher = new ContextEntityFetcher(
            { flowId: syncContext.flowId },
            this.registerDataAccess
        )
        const inputEntities = await this.adapterDefinition.entitiesGet(entityFetcher);
        const inputEntitiesInitialValues = getWithInitFormat(inputEntities, this.adapterDefinition.outputType)
        const registers = initRegisters(inputEntitiesInitialValues, syncContext);
        this.calculateSourceId(registers, entityFetcher.getHistory())
        return registers;
    }

    private calculateSourceId(registers: Register[], history: RegisterDataFilter[]) {
        const sourceId = history.reduce((id, curr) => {
            return id + "-" + curr.registerType + "_" + curr.registerStatus
        }, "00000000")

        if (sourceId != "00000000")
            for (const register of registers) {
                register.sourceRelativeId = sourceId
                register.sourceAbsoluteId = sourceId
            }
    }

    async processRegisters(outputRegisters: Register[]) {
        await this.validateRegisters(outputRegisters);
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
}

export abstract class LocalAdapterFlexDefinition<output extends object> implements AdapterDefinition {
    abstract readonly id: string;
    abstract readonly outputType: string
    abstract readonly definitionType: string;
    abstract readonly entitiesGet: (entityFetcher: EntityFetcher) => Promise<InputEntity<output>[]>
    abstract readonly entityValidate: (outputEntity: output | null) => Promise<ValidationResult | ValidationStatusTag> //data quality, error handling (error prevention), managin Bad Data-> triage or CleanUp
}

