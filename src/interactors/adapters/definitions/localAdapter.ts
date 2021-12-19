import { Entity, Register, SyncContext, RegisterStatusTag, EntityWithMeta, RegisterDataAccess } from "../../registers/types";
import { Adapter, AdapterDefinition, AdapterRunOptions } from "../types"
import { v4 as uuidv4 } from 'uuid';
import { EntityInitValues, MyAdapterDependencies } from "./types";
import { cloneDeep } from 'lodash'
import { AdvancedRegisterFetcher } from "../../registers/utils";




/**
 * Local adapter
 * Persistance registers
 * row-by-row
 * Throw excepcion on unexpected error (all records fail)
 * Check failed on handle error (1 record fails)
 */
export abstract class LocalAdapter<ad extends AdapterDefinition> implements Adapter<ad>{

    public readonly adapterDefinition: ad;
    protected readonly registerDataAccess: RegisterDataAccess;

    constructor(dependencies: MyAdapterDependencies<ad>) {
        this.adapterDefinition = dependencies.adapterDefinition;
        this.registerDataAccess = dependencies.registerDataAccess;
    }

    async run(runOptions: AdapterRunOptions) {
        const inputRegisters = await this.inputRegisters(runOptions);
        await this.outputRegisters(inputRegisters, runOptions);
    }

    private async inputRegisters(runOptions: AdapterRunOptions): Promise<Register<Entity>[]> {
        let inputRegisters = [];

        if (runOptions?.useInputEntities) {
            inputRegisters = await this.registerDataAccess.getAll(
                {
                    registerType: "inputMocked",
                    ...runOptions.syncContext
                }
            )
        }
        else if (runOptions?.onlyFailedEntities) {
            const failedRegisters = await this.registerDataAccess.getAll({
                registerType: this.adapterDefinition.outputType,
                registerStatus: RegisterStatusTag.failed,
                stepId: runOptions.syncContext.stepId
            })
            const arg = new AdvancedRegisterFetcher(this.registerDataAccess);
            // const oldInputRegisters = await arg.getRelativeRegisters(failedRegisters)
            // const inputEntitiesWithMeta = oldInputRegisters.map(oir => {
            //     return {
            //         entity: oir.entity,
            //         meta: oir.meta,
            //         sourceAbsoluteId: oir.sourceAbsoluteId,
            //         sourceRelativeId: oir.id
            //     }
            // })
            // inputRegisters = await this.initRegisters(inputEntitiesWithMeta, runOptions.syncContext)
            inputRegisters = await arg.getRelativeRegisters(failedRegisters)
        }
        else {
            inputRegisters = await this.getRegisters(runOptions.syncContext)
        }

        return cloneDeep(inputRegisters);
    }

    protected async initRegisters(inputEntities: (EntityInitValues<Entity> | EntityWithMeta<Entity>)[], syncContext: SyncContext): Promise<Register<Entity>[]> {
        return inputEntities.map((inputEntity) => {
            const entity: EntityInitValues<Entity> = inputEntity as EntityInitValues<Entity>
            const inputEntityId = uuidv4();
            return {
                id: inputEntityId,
                entityType: this.adapterDefinition.outputType,
                sourceAbsoluteId: entity.sourceAbsoluteId || inputEntityId,
                sourceRelativeId: entity.sourceRelativeId || inputEntityId,
                statusTag: RegisterStatusTag.pending,
                statusMeta: null,
                entity: entity.entity,
                meta: entity.meta,
                syncContext,
            }
        })
    }

    protected abstract getRegisters(syncContext: SyncContext): Promise<Register<Entity>[]>

    protected abstract outputRegisters(inputRegisters: Register<Entity>[], runOptions: AdapterRunOptions): Promise<void>

}
