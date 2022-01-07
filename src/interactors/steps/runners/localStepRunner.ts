import EventEmitter from 'events';
import { cloneDeep } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { SyncContext } from '../../registers/types';
import { StepDefinition } from '../definitions/types';
import { Step, StepRunOptions } from '../processes/types';
import { StepRunner, StepStatusTag, StepStatus } from './types';

export class LocalStepRunner implements StepRunner {

    public readonly step: Step<StepDefinition>;
    private readonly stepPresenter: EventEmitter;

    constructor(dependencies: any) {
        this.stepPresenter = dependencies.stepPresenter;
        this.step = dependencies.step;
    }

    async run(syncContext: SyncContext, runOptions?: StepRunOptions) {
        runOptions = cloneDeep(runOptions)
        syncContext = cloneDeep(syncContext)

        const stepStatus = this.buildStatus(syncContext)
        this.stepPresenter.emit("stepStatus", cloneDeep(stepStatus))

        stepStatus.statusTag = StepStatusTag.active
        stepStatus.timeStarted = new Date()
        this.stepPresenter.emit("stepStatus", cloneDeep(stepStatus))

        try {
            const stepSummary = await this.step.run(stepStatus.syncContext, runOptions)
            stepStatus.statusSummary = stepSummary
            if (stepSummary.isInvalidRegistersSummary) {
                stepStatus.statusTag = StepStatusTag.invalid
            } else {
                stepStatus.statusTag = StepStatusTag.success
            }
        } catch (error: any) {
            stepStatus.statusTag = StepStatusTag.failed
            stepStatus.statusMeta = error.message
            this.stepPresenter.emit("stepError", { error, statusId: stepStatus.id })
        }

        stepStatus.timeFinished = new Date()
        this.stepPresenter.emit("stepStatus", cloneDeep(stepStatus))
        return cloneDeep(stepStatus);
    }

    private buildStatus(syncContext: SyncContext): StepStatus {
        const id = uuidv4();
        const stepDefinition = this.step.stepDefinition;
        const stepStatus: StepStatus = {
            id,
            definitionId: stepDefinition.id,
            definitionType: stepDefinition.definitionType,
            statusTag: StepStatusTag.pending,
            statusMeta: null,
            syncContext: { ...syncContext, stepId: id },
            statusSummary: null,
            timeStarted: null,
            timeFinished: null
        }
        return stepStatus
    }
}