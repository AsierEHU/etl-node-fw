import EventEmitter from "events";
import { Entity, Register, SyncContext, RegisterStatusTag } from "../../registers/types";
import { Adapter, AdapterStatus, AdapterDefinition, EntityWithMeta, AdapterRunOptions, AdapterStatusSummary, AdapterStatusTag } from "../types"
import { v4 as uuidv4 } from 'uuid';
import { EntityInitValues, MyAdapterDependencies, RegisterDataAccess } from "./types";
import { AdvancedRegisterFetcher, calculateSummary, getWithMetaFormat } from "./utils";
import { cloneDeep } from 'lodash'




/**
 * Local adapter
 * Persistance registers
 * row-by-row
 * Throw excepcion on unexpected error (all records fail)
 * Check failed on handle error (1 record fails)
 */
export abstract class LocalAdapter<ad extends AdapterDefinition> implements Adapter<ad>{

    protected readonly adapterDefinition: ad;
    protected readonly adapterPresenter: EventEmitter
    protected readonly registerDataAccess: RegisterDataAccess;
    protected readonly adapterStatus: AdapterStatus
    protected readonly syncUpperContext?: SyncContext


    constructor(dependencies: MyAdapterDependencies<ad>) {
        this.adapterDefinition = dependencies.adapterDefinition;
        this.adapterPresenter = dependencies.adapterPresenter;
        this.registerDataAccess = dependencies.registerDataAccess;
        this.syncUpperContext = dependencies.syncContext;

        const id = uuidv4();
        this.adapterStatus = {
            id,
            definitionId: this.adapterDefinition.id,
            definitionType: this.adapterDefinition.definitionType,
            outputType: this.adapterDefinition.outputType,
            statusTag: AdapterStatusTag.pending,
            statusMeta: null,
            statusSummary: null,
            runOptions: null,
            syncContext: { ...this.syncUpperContext, apdaterId: id }
        }
        this.presentStatus()
    }

    async runOnce(runOptions?: AdapterRunOptions) {
        if (this.adapterStatus.statusTag != AdapterStatusTag.pending)
            throw new Error("Run once")

        this.adapterStatus.runOptions = cloneDeep(runOptions) || null;
        this.adapterStatus.statusTag = AdapterStatusTag.active
        await this.presentStatus()

        try {
            const inputRegisters = await this.inputRegisters(runOptions);
            const outputRegisters = await this.outputRegisters(inputRegisters);
            this.adapterStatus.statusSummary = calculateSummary(outputRegisters);
            this.adapterStatus.statusTag = AdapterStatusTag.success
        } catch (error: any) {
            this.adapterStatus.statusTag = AdapterStatusTag.failed
            this.adapterStatus.statusMeta = error.message
        }

        await this.presentStatus()
        return this.adapterStatus.statusTag;
    }

    private async inputRegisters(runOptions?: AdapterRunOptions): Promise<Register<Entity>[]> {
        let inputRegisters = [];

        if (runOptions?.inputEntities) {
            const inputEntities = runOptions?.inputEntities || [];
            const inputEntitiesWithMeta = getWithMetaFormat(inputEntities)
            inputRegisters = await this.initRegisters(inputEntitiesWithMeta)
        }
        else if (runOptions?.onlyFailedEntities) {
            const failedRegisters = await this.registerDataAccess.getAll({
                registerType: this.adapterDefinition.outputType,
                registerStatus: RegisterStatusTag.failed,
                ...this.syncUpperContext
            })
            const arg = new AdvancedRegisterFetcher(this.registerDataAccess);
            const oldInputRegisters = await arg.getRelativeRegisters(failedRegisters)
            const inputEntitiesWithMeta = oldInputRegisters.map(oir => {
                return {
                    entity: oir.entity,
                    meta: oir.meta,
                    sourceAbsoluteId: oir.sourceAbsoluteId,
                    sourceRelativeId: oir.id
                }
            })
            inputRegisters = await this.initRegisters(inputEntitiesWithMeta)
        }
        else {
            inputRegisters = await this.getRegisters()
        }

        return cloneDeep(inputRegisters);
    }

    protected async initRegisters(inputEntities: (EntityInitValues<Entity> | EntityWithMeta<Entity>)[]): Promise<Register<Entity>[]> {
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
                syncContext: this.adapterStatus.syncContext,
            }
        })
    }

    protected abstract getRegisters(): Promise<Register<Entity>[]>

    protected abstract outputRegisters(inputRegisters: Register<Entity>[]): Promise<Register<Entity>[]>

    private async presentStatus() {
        const status = await this.getStatus()
        this.adapterPresenter.emit("adapterStatus", status)
    }

    async getStatus() {
        return cloneDeep(this.adapterStatus);
    }
}
