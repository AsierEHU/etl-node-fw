import EventEmitter from "events";
import { Entity, EntityWithMeta, Register, RegisterDataAccess, RegisterStatusTag, SyncContext } from "../../registers/types";
import { Adapter, AdapterDefinition, AdapterRunner, AdapterRunnerRunOptions, AdapterRunOptions, AdapterStatus, AdapterStatusSummary, AdapterStatusTag } from "../types";
import { v4 as uuidv4 } from 'uuid';
import { EntityInitValues } from "../definitions/types";
import { getWithMetaFormat } from "../../registers/utils";
import { cloneDeep } from "lodash";

export class LocalAdapterRunner implements AdapterRunner {

    public readonly adapter: Adapter<AdapterDefinition>;
    private readonly adapterPresenter: EventEmitter
    private readonly registerDataAccess: RegisterDataAccess;

    constructor(dependencies: any) {
        this.adapter = dependencies.adapter;
        this.adapterPresenter = dependencies.adapterPresenter;
        this.registerDataAccess = dependencies.registerDataAccess;
    }

    async run(runOptions?: AdapterRunnerRunOptions) {
        runOptions = cloneDeep(runOptions)
        const adapterStatus = this.buildStatus(runOptions?.syncContext)
        const adapterRunOptions: AdapterRunOptions = {
            syncContext: adapterStatus.syncContext,
            onlyFailedEntities: runOptions?.onlyFailedEntities
        }
        if (runOptions?.inputEntities) {
            const inputEntities = runOptions?.inputEntities || [];
            const inputEntitiesWithMeta = getWithMetaFormat(inputEntities)
            const inputRegisters = await this.initRegisters(inputEntitiesWithMeta, adapterStatus.syncContext)
            await this.registerDataAccess.saveAll(inputRegisters)
            adapterRunOptions.useInputEntities = true;
        }

        adapterStatus.runOptions = adapterRunOptions;
        this.adapterPresenter.emit("adapterStatus", cloneDeep(adapterStatus))

        adapterStatus.statusTag = AdapterStatusTag.active
        this.adapterPresenter.emit("adapterStatus", cloneDeep(adapterStatus))

        try {
            await this.adapter.run(adapterRunOptions)
            adapterStatus.statusSummary = await this.calculateSummary(adapterStatus.id)
            adapterStatus.statusTag = AdapterStatusTag.success
        } catch (error: any) {
            adapterStatus.statusTag = AdapterStatusTag.failed
            adapterStatus.statusMeta = error.message
        }

        this.adapterPresenter.emit("adapterStatus", cloneDeep(adapterStatus))
        return adapterStatus;
    }

    private buildStatus(syncContext?: SyncContext): AdapterStatus {
        const id = uuidv4();
        const adapterDefinition = this.adapter.adapterDefinition;
        const adapterStatus = {
            id,
            definitionId: adapterDefinition.id,
            definitionType: adapterDefinition.definitionType,
            outputType: adapterDefinition.outputType,
            statusTag: AdapterStatusTag.pending,
            statusMeta: null,
            statusSummary: null,
            runOptions: null,
            syncContext: { ...syncContext, apdaterId: id }
        }
        return adapterStatus
    }

    private async calculateSummary(apdaterId: string): Promise<AdapterStatusSummary> { //TODO: pasar esto al advanced register fetcher
        const outputRegisters = await this.registerDataAccess.getAll({ apdaterId })
        const statusSummary = {
            output_rows: outputRegisters.length,
            rows_success: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.success).length,
            rows_failed: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.failed).length,
            rows_invalid: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.invalid).length,
            rows_skipped: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.skipped).length,
        };
        return statusSummary;
    }

    private async initRegisters(inputEntities: (EntityInitValues<Entity> | EntityWithMeta<Entity>)[], syncContext: SyncContext): Promise<Register<Entity>[]> {
        return inputEntities.map((inputEntity) => {
            const entity: EntityInitValues<Entity> = inputEntity as EntityInitValues<Entity>
            const inputEntityId = uuidv4();
            return {
                id: inputEntityId,
                entityType: "inputMocked",
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
}