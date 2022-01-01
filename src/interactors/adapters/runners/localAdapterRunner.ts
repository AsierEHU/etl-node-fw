import EventEmitter from 'events';
import { cloneDeep } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { RegisterDataAccess, SyncContext } from '../../registers/types';
import { getWithInitFormat, initRegisters } from '../../registers/utils';
import { AdvancedRegisterFetcher } from '../../registers/utilsDB';
import { Adapter, AdapterDefinition, AdapterRunOptions } from '../processes/types';
import { AdapterRunner, AdapterRunnerRunOptions, AdapterStatusTag, AdapterStatus } from './types';

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
        if (runOptions?.pushEntities && !adapterRunOptions.onlyFailedEntities) {
            const pushEntities = runOptions?.pushEntities || [];
            const inputEntitiesWithMeta = getWithInitFormat(pushEntities)
            const inputRegisters = initRegisters(inputEntitiesWithMeta, { ...runOptions.syncContext })
            await this.registerDataAccess.saveAll(inputRegisters)
            adapterRunOptions.usePushedEntities = true;
        }

        adapterStatus.runOptions = adapterRunOptions;
        this.adapterPresenter.emit("adapterStatus", cloneDeep(adapterStatus))

        adapterStatus.statusTag = AdapterStatusTag.active
        adapterStatus.timeStarted = new Date()
        this.adapterPresenter.emit("adapterStatus", cloneDeep(adapterStatus))

        try {
            await this.adapter.run(adapterRunOptions)
            const arf = new AdvancedRegisterFetcher(this.registerDataAccess)
            adapterStatus.statusSummary = await arf.getRegistersSummary(adapterStatus.id)
            adapterStatus.statusTag = AdapterStatusTag.success
        } catch (error: any) {
            adapterStatus.statusTag = AdapterStatusTag.failed
            adapterStatus.statusMeta = error.message
            this.adapterPresenter.emit("adapterError", { error, statusId: adapterStatus.id })
        }

        adapterStatus.timeFinished = new Date()
        this.adapterPresenter.emit("adapterStatus", cloneDeep(adapterStatus))
        return cloneDeep(adapterStatus);
    }

    private buildStatus(syncContext?: SyncContext): AdapterStatus {
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