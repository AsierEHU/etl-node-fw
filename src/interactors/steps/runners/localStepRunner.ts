import EventEmitter from 'events';
import { cloneDeep } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { AdapterRunnerRunOptions } from '../../adapters/runners/types';
import { SyncContext } from '../../registers/types';
import { Step, StepDefinition } from '../processes/types';
import { StepRunner, StepStatusTag, StepStatus } from './types';

/**
 * Local async step, persistance
 */
export class LocalStepRunner implements StepRunner {

    public readonly step: Step<StepDefinition>;
    private readonly stepPresenter: EventEmitter;

    constructor(dependencies: any) {
        this.stepPresenter = dependencies.stepPresenter;
        this.step = dependencies.step;
    }

    async run(runOptions?: AdapterRunnerRunOptions) {
        runOptions = cloneDeep(runOptions)
        const stepStatus = this.buildStatus(runOptions?.syncContext)
        runOptions = { ...runOptions, syncContext: { ...runOptions?.syncContext, stepId: stepStatus.id } }
        this.stepPresenter.emit("stepStatus", cloneDeep(stepStatus))

        stepStatus.statusTag = StepStatusTag.active
        stepStatus.timeStarted = new Date()
        this.stepPresenter.emit("stepStatus", cloneDeep(stepStatus))

        try {
            const stepSummary = await this.step.run(runOptions)
            stepStatus.statusSummary = stepSummary
            if (stepSummary.failedByDefinition) {
                stepStatus.statusTag = StepStatusTag.failed
            } else {
                stepStatus.statusTag = StepStatusTag.success
            }
        } catch (error: any) {
            stepStatus.statusTag = StepStatusTag.failed
            stepStatus.statusMeta = error.message
        }

        stepStatus.timeFinished = new Date()
        this.stepPresenter.emit("stepStatus", cloneDeep(stepStatus))
        return cloneDeep(stepStatus);
    }

    private buildStatus(syncContext?: SyncContext): StepStatus {
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