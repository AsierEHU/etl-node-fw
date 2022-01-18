import { generateSetSourceId, getWithInitFormat } from "../../../registers/utils";
import { LocalAdapter } from "./localAdapter";
import { v4 as uuidv4 } from 'uuid';
import { LocalAdapterSetTransformerDefinition } from "../../definitions/localAdapter/types";
import { SyncContext, Register, RegisterStatusTag } from "../../../../business/register";

export class LocalAdapterSetTransformer<ad extends LocalAdapterSetTransformerDefinition<any>> extends LocalAdapter<ad>{

    constructor(dependencies: any) {
        super(dependencies)
    }

    protected async getRegisters(syncContext: SyncContext): Promise<Register[]> {
        let registers: Register[] = []
        for (const inputType of this.adapterDefinition.inputTypes) {
            const inputRegisters = await this.registerDataAccess.getAll({
                entityType: inputType,
                registerStatus: RegisterStatusTag.success,
                flowId: syncContext.flowId
            })
            registers = [...registers, ...inputRegisters]
        }
        return registers
    }

    async processRegisters(inputRegisters: Register[], syncContext: SyncContext) {
        if (!inputRegisters.length)
            return
        const outputRegisters = await this.transformSets(inputRegisters, syncContext);
        await this.registerDataAccess.saveAll(outputRegisters)
    }

    private async transformSets(inputRegisters: Register[], syncContext: SyncContext): Promise<Register[]> {
        const sets: { [type: string]: any[] } = {}
        for (const inputType of this.adapterDefinition.inputTypes) {
            sets[inputType] = []
        }
        for (const inputRegister of inputRegisters) {
            const inputType = inputRegister.entityType
            sets[inputType].push(inputRegister.entity)
        }
        const sourceId = generateSetSourceId(this.adapterDefinition.inputTypes)
        try {
            const outputEntities = await this.adapterDefinition.setsProcess(sets)
            const outputEntitiesInitialValues = getWithInitFormat(
                outputEntities,
                this.adapterDefinition.outputType,
                this.adapterDefinition.id
            )
            return outputEntitiesInitialValues.map((entity) => {
                return {
                    id: uuidv4(),
                    entityType: entity.entityType,
                    sourceAbsoluteId: sourceId,
                    sourceRelativeId: sourceId,
                    sourceEntityId: entity.sourceEntityId || null,
                    statusTag: RegisterStatusTag.success,
                    statusMeta: null,
                    entity: entity.entity,
                    meta: entity.meta || null,
                    date: new Date(),
                    definitionId: entity.definitionId,
                    syncContext,
                }
            })
        } catch (error: any) {
            const register: Register = {
                id: uuidv4(),
                entityType: this.adapterDefinition.outputType,
                sourceAbsoluteId: sourceId,
                sourceRelativeId: sourceId,
                sourceEntityId: null,
                statusTag: RegisterStatusTag.failed,
                statusMeta: error.message,
                entity: null,
                meta: null,
                date: new Date(),
                definitionId: this.adapterDefinition.id,
                syncContext
            }
            return [register]
        }
    }

}
