import EventEmitter from 'events';
import { cloneDeep } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { RegisterDataAccess, SyncContext } from '../../registers/types';
import { AdvancedRegisterFetcher } from '../../registers/utilsDB';
import { AdapterDefinition } from '../definitions/types';
import { Adapter, AdapterRunOptions } from '../processes/types';
import { AdapterRunner, AdapterStatusTag, AdapterStatus } from './types';

export class LocalAdapterRunner implements AdapterRunner {

    public readonly adapter: Adapter<AdapterDefinition>;
    private readonly adapterPresenter: EventEmitter
    private readonly registerDataAccess: RegisterDataAccess;

    constructor(dependencies: any) {
        this.adapter = dependencies.adapter;
        this.adapterPresenter = dependencies.adapterPresenter;
        this.registerDataAccess = dependencies.registerDataAccess;
    }

    async run(syncContext: SyncContext, runOptions?: AdapterRunOptions) {
        runOptions = cloneDeep(runOptions)
        syncContext = cloneDeep(syncContext)
        const adapterStatus = this.buildStatus(syncContext)
        adapterStatus.runOptions = runOptions || null
        this.adapterPresenter.emit("adapterStatus", cloneDeep(adapterStatus))

        adapterStatus.statusTag = AdapterStatusTag.active
        adapterStatus.timeStarted = new Date()
        this.adapterPresenter.emit("adapterStatus", cloneDeep(adapterStatus))

        try {
            await this.adapter.run(adapterStatus.syncContext, runOptions)
            adapterStatus.statusTag = AdapterStatusTag.success
        } catch (error: any) {
            adapterStatus.statusTag = AdapterStatusTag.failed
            adapterStatus.statusMeta = error.message
            this.adapterPresenter.emit("adapterError", { error, statusId: adapterStatus.id })
        }
        adapterStatus.timeFinished = new Date()

        const arf = new AdvancedRegisterFetcher(this.registerDataAccess)
        adapterStatus.statusSummary = await arf.getRegistersAdapterSummary(adapterStatus.id)
        this.adapterPresenter.emit("adapterStatus", cloneDeep(adapterStatus))
        
        return cloneDeep(adapterStatus);
    }

    private buildStatus(syncContext: SyncContext): AdapterStatus {
        const id = uuidv4();
        const adapterDefinition = this.adapter.adapterDefinition;
        const adapterStatus: AdapterStatus = {
            id,
            definitionId: adapterDefinition.id,
            definitionType: adapterDefinition.definitionType,
            outputType: adapterDefinition.outputType,
            statusTag: AdapterStatusTag.pending,
            statusMeta: null,
            statusSummary: null,
            runOptions: null,
            syncContext: { ...syncContext, adapterId: id },
            timeStarted: null,
            timeFinished: null
        }
        return adapterStatus
    }
}