import EventEmitter from "events";
import { RegisterDataAccess, SyncContext } from "../../registers/types";
import { Adapter, AdapterDefinition, AdapterRunner, AdapterRunnerRunOptions, AdapterRunOptions, AdapterStatus, AdapterStatusTag } from "../types";
import { v4 as uuidv4 } from 'uuid';
import { getWithInitFormat, initRegisters } from "../../registers/utils";
import { cloneDeep } from "lodash";
import { AdvancedRegisterFetcher } from "../../registers/utilsDB";

export class LocalAdapterRunner implements AdapterRunner {

    public readonly adapter: Adapter<AdapterDefinition>;
    private readonly adapterPresenter: EventEmitter
    private readonly registerDataAccess: RegisterDataAccess;

    constructor(dependencies: any) {
        this.adapter = dependencies.adapter;
        this.adapterPresenter = dependencies.adapterPresenter;
        this.registerDataAccess = dependencies.registerDataAccess;
    }
    //TODO:Run, run with mockoptions, run with input values
    async run(runOptions?: AdapterRunnerRunOptions) {
        runOptions = cloneDeep(runOptions)
        const adapterStatus = this.buildStatus(runOptions?.syncContext)
        const adapterRunOptions: AdapterRunOptions = {
            syncContext: adapterStatus.syncContext,
            onlyFailedEntities: runOptions?.onlyFailedEntities
        }
        if (runOptions?.mockEntities) {
            const mockEntities = runOptions?.mockEntities || [];
            const inputEntitiesWithMeta = getWithInitFormat(mockEntities)
            const inputRegisters = initRegisters(inputEntitiesWithMeta, adapterStatus.syncContext)
            await this.registerDataAccess.saveAll(inputRegisters)
            adapterRunOptions.useMockedEntities = true;
        }

        adapterStatus.runOptions = adapterRunOptions;
        this.adapterPresenter.emit("adapterStatus", cloneDeep(adapterStatus))

        adapterStatus.statusTag = AdapterStatusTag.active
        this.adapterPresenter.emit("adapterStatus", cloneDeep(adapterStatus))

        try {
            await this.adapter.run(adapterRunOptions)
            const arf = new AdvancedRegisterFetcher(this.registerDataAccess)
            adapterStatus.statusSummary = await arf.getRegistersSummary(adapterStatus.id)
            adapterStatus.statusTag = AdapterStatusTag.success
        } catch (error: any) {
            adapterStatus.statusTag = AdapterStatusTag.failed
            adapterStatus.statusMeta = error.message
        }

        this.adapterPresenter.emit("adapterStatus", cloneDeep(adapterStatus))
        return cloneDeep(adapterStatus);
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
            statusSummary: {
                output_rows: 0,
                rows_success: 0,
                rows_failed: 0,
                rows_invalid: 0,
                rows_skipped: 0,
            },
            runOptions: null,
            syncContext: { ...syncContext, apdaterId: id }
        }
        return adapterStatus
    }
}