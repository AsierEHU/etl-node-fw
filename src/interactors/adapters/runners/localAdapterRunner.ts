import EventEmitter from 'events';
import { cloneDeep } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { ProcessStatus, StatusTag } from '../../../business/processStatus';
import { SyncContext } from '../../../business/register';
import { ProcessStatusDataAccess } from '../../common/processes';
import { RegisterDataAccess } from '../../registers/types';
import { AdvancedRegisterFetcher } from '../../registers/utilsDB';
import { AdapterDefinition } from '../definitions/types';
import { Adapter, AdapterRunOptions } from '../processes/types';
import { AdapterRunner, AdapterStatus } from './types';

export class LocalAdapterRunner implements AdapterRunner {

    public readonly adapter: Adapter<AdapterDefinition>;
    private readonly adapterPresenter: EventEmitter
    private readonly registerDataAccess: RegisterDataAccess;
    private readonly processStatusDataAccess: ProcessStatusDataAccess

    constructor(dependencies: any) {
        this.adapter = dependencies.adapter;
        this.adapterPresenter = dependencies.adapterPresenter;
        this.registerDataAccess = dependencies.registerDataAccess;
        this.processStatusDataAccess = dependencies.processStatusDataAccess
    }

    async run(syncContext: SyncContext, runOptions?: AdapterRunOptions) {
        runOptions = cloneDeep(runOptions)
        syncContext = cloneDeep(syncContext)

        const processStatus = this.buildProcessStatus(syncContext, runOptions)
        await this.processStatusDataAccess.save(processStatus)
        let presenterData = this.buildPresenterData(processStatus)
        this.adapterPresenter.emit("adapterStatus", cloneDeep(presenterData))

        processStatus.statusTag = StatusTag.active
        processStatus.timeStarted = new Date()
        await this.processStatusDataAccess.save(processStatus)
        presenterData = this.buildPresenterData(processStatus)
        this.adapterPresenter.emit("adapterStatus", cloneDeep(presenterData))

        try {
            await this.adapter.run(processStatus.syncContext, runOptions)
            processStatus.statusTag = StatusTag.success
        } catch (error: any) {
            processStatus.statusTag = StatusTag.failed
            processStatus.statusMeta = error.message
            this.adapterPresenter.emit("adapterError", { error, statusId: processStatus.id })
        }
        processStatus.timeFinished = new Date()
        await this.processStatusDataAccess.save(processStatus)
        presenterData = this.buildPresenterData(processStatus)
        const arf = new AdvancedRegisterFetcher(this.registerDataAccess)
        presenterData.statusSummary = await arf.getRegistersAdapterSummary(processStatus.id)
        this.adapterPresenter.emit("adapterStatus", cloneDeep(presenterData))

        return cloneDeep(presenterData);
    }

    private buildProcessStatus(syncContext: SyncContext, runOptions: any): ProcessStatus {
        const id = uuidv4();
        const adapterDefinition = this.adapter.adapterDefinition;
        const adapterStatus: ProcessStatus = {
            id,
            definitionId: adapterDefinition.id,
            statusTag: StatusTag.pending,
            statusMeta: null,
            runOptions: runOptions,
            syncContext: { ...syncContext, adapterId: id },
            timeStarted: null,
            timeFinished: null
        }
        return adapterStatus
    }

    private buildPresenterData(processStatus: ProcessStatus): AdapterStatus {
        const adapterDefinition = this.adapter.adapterDefinition;
        const adapterStatus: AdapterStatus = {
            ...processStatus,
            definitionId: adapterDefinition.id,
            definitionType: adapterDefinition.definitionType,
            outputType: adapterDefinition.outputType,
            statusSummary: null,
        }
        return adapterStatus
    }
}