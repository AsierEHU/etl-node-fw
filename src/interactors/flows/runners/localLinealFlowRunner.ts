import EventEmitter from 'events';
import { cloneDeep } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { ProcessStatus, StatusTag, ProcessType } from '../../../business/processStatus';
import { ProcessStatusDataAccess } from '../../common/processes';
import { FlowDefinition } from '../definitions/types';
import { Flow, FlowRunOptions } from '../processes/types';
import { FlowRunner, FlowPresenter, FlowStatusSummary, } from './types';

export class LocalLinealFlowRunner implements FlowRunner {

    public readonly flow: Flow<FlowDefinition>;
    private readonly flowPresenter: EventEmitter
    private readonly processStatusDataAccess: ProcessStatusDataAccess;

    constructor(dependencies: any) {
        this.flow = dependencies.flow;
        this.flowPresenter = dependencies.flowPresenter;
        this.processStatusDataAccess = dependencies.processStatusDataAccess
    }

    async run(runOptions?: FlowRunOptions) {
        runOptions = cloneDeep(runOptions)

        const processStatus = this.buildProcessStatus()
        await this.processStatusDataAccess.save(processStatus)
        let presenterData = this.buildPresenterData(processStatus)
        this.flowPresenter.emit("flowStatus", presenterData)

        processStatus.statusTag = StatusTag.active
        processStatus.timeStarted = new Date()
        await this.processStatusDataAccess.save(processStatus)
        presenterData = this.buildPresenterData(processStatus)
        this.flowPresenter.emit("flowStatus", presenterData)

        try {
            await this.flow.run(processStatus.syncContext, runOptions)
            processStatus.statusTag = StatusTag.success
        } catch (error: any) {
            processStatus.statusTag = StatusTag.failed
            processStatus.statusMeta = error.message
            this.flowPresenter.emit("flowError", { error, statusId: processStatus.id })
        }

        processStatus.timeFinished = new Date()
        await this.processStatusDataAccess.save(processStatus)
        presenterData = this.buildPresenterData(processStatus)
        presenterData.statusSummary = await this.getFlowStatusSummary(processStatus.id)
        this.flowPresenter.emit("flowStatus", presenterData)

        return presenterData;
    }

    private buildProcessStatus(): ProcessStatus {
        const id = uuidv4();
        const flowDefinition = this.flow.flowDefinition;
        const processStatus: ProcessStatus = {
            id,
            definitionId: flowDefinition.id,
            statusTag: StatusTag.pending,
            statusMeta: null,
            syncContext: { flowId: id },
            timeStarted: null,
            timeFinished: null,
            runOptions: null,
            processType: ProcessType.flow
        }
        return processStatus
    }

    private buildPresenterData(processStatus: ProcessStatus): FlowPresenter {
        const flowDefinition = this.flow.flowDefinition;
        const stepStatus: FlowPresenter = {
            id: processStatus.id,
            timeStarted: processStatus.timeStarted,
            timeFinished: processStatus.timeFinished,
            definitionId: flowDefinition.id,
            definitionType: flowDefinition.definitionType,
            statusSummary: null,
            statusTag: processStatus.statusTag,
            statusMeta: processStatus.statusMeta,
            syncContext: { ...processStatus.syncContext }
        }
        return stepStatus
    }

    private async getFlowStatusSummary(flowId: string): Promise<FlowStatusSummary> {
        const steps = await this.processStatusDataAccess.getAll({ flowId, type: ProcessType.step })
        const flowStatusSummary: FlowStatusSummary = {
            stepsSuccess: steps.filter(step => step.statusTag == StatusTag.success).length,
            stepsFailed: steps.filter(step => step.statusTag == StatusTag.failed).length,
            stepsInvalid: steps.filter(step => step.statusTag == StatusTag.invalid).length,
        }
        return flowStatusSummary
    }

}