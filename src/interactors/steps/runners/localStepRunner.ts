import EventEmitter from 'events';
import { cloneDeep } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { StatusTag, ProcessStatus, ProcessType } from '../../../business/processStatus';
import { SyncContext } from '../../../business/register';
import { ProcessStatusDataAccess } from '../../common/processes';
import { RegisterDataAccess } from '../../common/registers';
import { RegistersStepMetricsReport } from '../../reports/registersStepMetricsReport';
import { StepDefinition } from '../definitions/types';
import { Step, StepRunOptions } from '../processes/types';
import { StepRunner, StepPresenter, StepStatusSummary } from './types';

export class LocalStepRunner implements StepRunner {

    public readonly step: Step<StepDefinition>;
    private readonly stepPresenter: EventEmitter;
    private readonly registerDataAccess: RegisterDataAccess;
    private readonly processStatusDataAccess: ProcessStatusDataAccess;

    constructor(dependencies: any) {
        this.stepPresenter = dependencies.stepPresenter;
        this.step = dependencies.step;
        this.registerDataAccess = dependencies.registerDataAccess;
        this.processStatusDataAccess = dependencies.processStatusDataAccess
    }

    async run(syncContext: SyncContext, runOptions?: StepRunOptions) {
        runOptions = cloneDeep(runOptions)
        syncContext = cloneDeep(syncContext)

        const processStatus = this.buildProcessStatus(syncContext)
        await this.processStatusDataAccess.save(processStatus)
        let presenterData = this.buildPresenterData(processStatus)
        this.stepPresenter.emit("stepStatus", presenterData)

        processStatus.statusTag = StatusTag.active
        processStatus.timeStarted = new Date()
        await this.processStatusDataAccess.save(processStatus)
        presenterData = this.buildPresenterData(processStatus)
        this.stepPresenter.emit("stepStatus", presenterData)

        try {
            await this.step.run(processStatus.syncContext, runOptions)
            processStatus.statusTag = StatusTag.success
        } catch (error: any) {
            if (error.message === "Invalid by definition") {
                processStatus.statusTag = StatusTag.invalid
            } else {
                processStatus.statusTag = StatusTag.failed
                processStatus.statusMeta = error.message
                this.stepPresenter.emit("stepError", { error, statusId: processStatus.id })
            }
        }
        processStatus.timeFinished = new Date()
        await this.processStatusDataAccess.save(processStatus)
        presenterData = this.buildPresenterData(processStatus)
        const report = new RegistersStepMetricsReport({ registerDataAccess: this.registerDataAccess })
        const stepStatusSummary: StepStatusSummary = {
            registerStats: await report.getReport(processStatus.id, true),
            retries: await this.getStepRetries(processStatus.id),
        }
        presenterData.statusSummary = stepStatusSummary
        this.stepPresenter.emit("stepStatus", presenterData)

        return presenterData;
    }

    private async getStepRetries(stepId: string) {
        const adaptersStatus = await this.processStatusDataAccess.getAll({ stepId, type: ProcessType.adapter })
        return adaptersStatus.length - 1
    }

    private buildProcessStatus(syncContext: SyncContext): ProcessStatus {
        const id = uuidv4();
        const stepDefinition = this.step.stepDefinition;
        const processStatus: ProcessStatus = {
            id,
            definitionId: stepDefinition.id,
            statusTag: StatusTag.pending,
            statusMeta: null,
            runOptions: null,
            syncContext: { ...syncContext, stepId: id },
            timeStarted: null,
            timeFinished: null,
            processType: ProcessType.step
        }
        return processStatus
    }

    private buildPresenterData(processStatus: ProcessStatus): StepPresenter {
        const stepDefinition = this.step.stepDefinition;
        const stepStatus: StepPresenter = {
            id: processStatus.id,
            timeStarted: processStatus.timeStarted,
            timeFinished: processStatus.timeFinished,
            definitionId: stepDefinition.id,
            definitionType: stepDefinition.definitionType,
            statusSummary: null,
            statusTag: processStatus.statusTag,
            statusMeta: processStatus.statusMeta,
            syncContext: { ...processStatus.syncContext }
        }
        return stepStatus
    }
}