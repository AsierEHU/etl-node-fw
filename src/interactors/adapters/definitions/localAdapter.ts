import EventEmitter from "events";
import { Entity, Register, SyncContext, RegisterStatusTag } from "../../registers/types";
import { Adapter, AdapterStatus, AdapterDefinition, EntityWithMeta, AdapterRunOptions, AdapterStatusSummary } from "../types"
import { v4 as uuidv4 } from 'uuid';
import { MyAdapterDependencies, RegisterDataAccess } from "./types";
import { calculateSummary, getWithMetaFormat } from "./utils";
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
            statusSummary: null,
            runOptions: null,
            syncContext: { ...this.syncUpperContext, apdaterId: id }
        }
        this.adapterPresenter.emit("adapterStatus", this.adapterStatus)
    }

    async runOnce(runOptions?: AdapterRunOptions): Promise<AdapterStatusSummary> {
        if (this.adapterStatus.statusSummary)
            throw new Error("Run once")

        this.adapterStatus.statusSummary = {
            output_rows: 0,
            rows_success: 0,
            rows_failed: 0,
            rows_invalid: 0,
            rows_skipped: 0,
        };
        this.adapterStatus.runOptions = cloneDeep(runOptions) || null;

        const inputRegisters = await this.inputRegisters(runOptions);
        const outputRegisters = await this.outputRegisters(inputRegisters);

        this.adapterStatus.statusSummary = calculateSummary(outputRegisters);
        this.adapterPresenter.emit("adapterStatus", this.adapterStatus)
        return this.adapterStatus.statusSummary;
    }

    private async inputRegisters(runOptions?: AdapterRunOptions): Promise<Register<Entity>[]> {
        let inputRegisters = [];

        if (runOptions?.mockEntities) {
            const inputEntities = runOptions?.mockEntities || [];
            const inputEntitiesWithMeta = getWithMetaFormat(inputEntities)
            inputRegisters = await this.initRegisters(inputEntitiesWithMeta)
        }
        else if (runOptions?.onlyFailedEntities) {
            const outputRegisters = await this.registerDataAccess.getAll({
                registerType: this.adapterDefinition.outputType,
                registerStatus: RegisterStatusTag.failed,
                ...this.syncUpperContext
            })
            const oldInputRegistersIds = outputRegisters.map(outputRegister => outputRegister.sourceRelativeId) as string[]
            const oldInputRegisters = await this.registerDataAccess.getAll(undefined, oldInputRegistersIds)
            const inputEntitiesWithMeta = oldInputRegisters.map(oir => { return { entity: oir.entity, meta: oir.meta } })
            inputRegisters = await this.initRegisters(inputEntitiesWithMeta)
        }
        else {
            inputRegisters = await this.getRegisters()
        }

        return cloneDeep(inputRegisters);
    }

    protected async initRegisters(inputEntities: EntityWithMeta<Entity>[]): Promise<Register<Entity>[]> {
        return inputEntities.map(inputEntity => {
            const inputEntityId = uuidv4();
            return {
                id: inputEntityId,
                entityType: this.adapterDefinition.outputType,
                sourceAbsoluteId: inputEntityId,
                sourceRelativeId: inputEntityId,
                statusTag: RegisterStatusTag.pending,
                statusMeta: null,
                entity: inputEntity.entity,
                meta: inputEntity.meta,
                syncContext: this.adapterStatus.syncContext,
            }
        })
    }

    protected abstract getRegisters(): Promise<Register<Entity>[]>

    protected abstract outputRegisters(inputRegisters: Register<Entity>[]): Promise<Register<Entity>[]>

    async getStatus() {
        return this.adapterStatus;
    }
}
