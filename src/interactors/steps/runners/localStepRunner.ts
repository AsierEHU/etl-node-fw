import EventEmitter from "events";
import { RegisterDataAccess, RegisterStatusTag, SyncContext } from "../../registers/types";
import { Step, StepStatus, StepStatusTag, StepDefinition, StepRunner, StepRunnerRunOptions, StepStatusSummary, StepRunOptions } from "../types"
import { v4 as uuidv4 } from 'uuid';
import { cloneDeep } from "lodash";

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

    async run(runOptions?: StepRunnerRunOptions) {
        runOptions = cloneDeep(runOptions)
        const stepStatus = this.buildStatus(runOptions?.syncContext)
        const stepRunOptions: StepRunOptions = {
            syncContext: stepStatus.syncContext,
            mockEntities: runOptions?.mockEntities
        }

        stepStatus.runOptions = stepRunOptions
        this.stepPresenter.emit("stepStatus", cloneDeep(stepStatus))

        stepStatus.statusTag = StepStatusTag.active
        this.stepPresenter.emit("stepStatus", cloneDeep(stepStatus))

        try {
            const stepSummary = await this.step.run(stepRunOptions)
            stepStatus.statusSummary = stepSummary
            if (stepSummary.isFailedStep) {
                stepStatus.statusTag = StepStatusTag.failed
            } else {
                stepStatus.statusTag = StepStatusTag.success
            }
        } catch (error: any) {
            stepStatus.statusTag = StepStatusTag.failed
            stepStatus.statusMeta = error.message
        }

        this.stepPresenter.emit("stepStatus", cloneDeep(stepStatus))
        return cloneDeep(stepStatus);
    }

    private buildStatus(syncContext?: SyncContext): StepStatus {
        const id = uuidv4();
        const stepDefinition = this.step.stepDefinition;
        const stepStatus = {
            id,
            definitionId: stepDefinition.id,
            definitionType: stepDefinition.definitionType,
            statusTag: StepStatusTag.pending,
            statusMeta: null,
            runOptions: null,
            syncContext: { ...syncContext, stepId: id },
            statusSummary: {
                registerStatusSummary: {
                    output_rows: 0,
                    rows_success: 0,
                    rows_failed: 0,
                    rows_invalid: 0,
                    rows_skipped: 0,
                },
                tryNumber: 0,
                timeStarted: null,
                timeFinished: null,
                isFailedStep: false,
            }
        }
        return stepStatus
    }
}