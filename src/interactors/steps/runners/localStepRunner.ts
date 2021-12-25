import EventEmitter from "events";
import { SyncContext } from "../../registers/types";
import { Step, StepStatus, StepStatusTag, StepDefinition, StepRunner } from "../types"
import { v4 as uuidv4 } from 'uuid';
import { cloneDeep } from "lodash";
import { AdapterRunnerRunOptions } from "../../adapters/types";

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
        this.stepPresenter.emit("stepStatus", cloneDeep(stepStatus))

        try {
            const stepSummary = await this.step.run(runOptions)
            stepStatus.statusSummary = stepSummary
            if (stepSummary.failedStatusSummary) {
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
                failedStatusSummary: false,
            }
        }
        return stepStatus
    }
}