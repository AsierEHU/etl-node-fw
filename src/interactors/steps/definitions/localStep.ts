import EventEmitter from "events";
import { AdapterFactory } from "../../adapters/factory";
import { AdapterDefinition, AdapterDependencies, AdapterRunOptions, AdapterStatus, AdapterStatusSummary, AdapterStatusTag } from "../../adapters/types";
import { SyncContext } from "../../registers/types";
import { Step, StepStatus, StepStatusTag, StepRunOptions, StepDefinition, StepStatusSummary } from "../types"
import { v4 as uuidv4 } from 'uuid';
import { MyStepDependencies } from "./types";
import { cloneDeep } from "lodash";

/**
 * Local async step, persistance
 */
export class LocalStep<sd extends LocalStepDefinition> implements Step<sd>{

    private readonly stepDefinition: sd;
    private readonly adapterFactory: AdapterFactory;
    private readonly stepStatus: StepStatus;
    private readonly stepPresenter: EventEmitter;
    private readonly adapterDependencies: AdapterDependencies<AdapterDefinition>;
    protected readonly syncUpperContext: SyncContext

    constructor(dependencies: MyStepDependencies<sd>) {
        this.stepDefinition = dependencies.stepDefinition;
        this.adapterFactory = dependencies.adapterFactory;
        this.stepPresenter = dependencies.stepPresenter;
        this.syncUpperContext = dependencies.syncContext;
        const id = uuidv4();
        this.stepStatus = {
            id,
            definitionId: this.stepDefinition.id,
            definitionType: this.stepDefinition.definitionType,
            statusTag: StepStatusTag.pending,
            tryNumber: 0,
            statusMeta: null,
            timeStarted: null,
            timeFinished: null,
            runOptions: null,
            syncContext: { ...this.syncUpperContext, stepId: id },
            statusSummary: null
        }
        this.adapterDependencies = dependencies.adapterDependencies;
        this.adapterDependencies.syncContext = this.stepStatus.syncContext;
        this.stepPresenter.emit("stepStatus", this.stepStatus)
    }

    async runOnce(runOptions?: StepRunOptions) {

        if (this.stepStatus.statusTag != StepStatusTag.pending)
            throw new Error("Run once")

        this.stepStatus.statusTag = StepStatusTag.active
        this.stepStatus.timeStarted = new Date();
        this.stepStatus.runOptions = cloneDeep(runOptions) || null;
        this.stepPresenter.emit("stepStatus", this.stepStatus)

        await this.tryRunAdapter(this.stepStatus.runOptions?.adapterRunOptions);

        this.stepStatus.timeFinished = new Date();
        this.stepPresenter.emit("stepStatus", this.stepStatus)

        return this.stepStatus.statusTag;
    }

    private async tryRunAdapter(adapterRunOptions?: AdapterRunOptions, tryNumber?: number) {
        this.stepStatus.tryNumber = tryNumber || 1;

        try {
            const adapter = this.adapterFactory.createAdapter(this.stepDefinition.adapterDefinitionId, this.adapterDependencies)
            const adapterStatusTag = await adapter.runOnce(adapterRunOptions)
            if (adapterStatusTag == AdapterStatusTag.failed && this.canRetry()) {
                await this.retryRunAdapter(adapterRunOptions)
            }
            else {
                const adapterStatus = await adapter.getStatus()
                this.stepStatus.statusSummary = this.getSummary(adapterStatus)
                if (this.stepStatus.statusSummary.rows_failed > 0 && this.canRetry()) {
                    await this.retryRunAdapter(adapterRunOptions)
                }
                else {
                    if (this.stepDefinition.isFailedStatus(this.stepStatus.statusSummary)) {
                        this.stepStatus.statusTag = StepStatusTag.failed;
                    } else {
                        this.stepStatus.statusTag = StepStatusTag.success;
                    }
                }
            }

        } catch (error: any) {
            if (this.canRetry()) {
                await this.tryRunAdapter(adapterRunOptions, this.stepStatus.tryNumber + 1);
            }
            else {
                this.stepStatus.statusMeta = error.message
                this.stepStatus.statusTag = StepStatusTag.failed;
            }
        }
    }

    private async retryRunAdapter(adapterRunOptions?: AdapterRunOptions) {
        const restartAdapterRunOptions = { ...adapterRunOptions, onlyFailedEntities: true }
        await this.tryRunAdapter(restartAdapterRunOptions, this.stepStatus.tryNumber + 1);
    }

    private getSummary(adapterStatus: AdapterStatus): StepStatusSummary {
        const adapterStatusSummary = adapterStatus.statusSummary
        const adapterRunOptions = adapterStatus.runOptions
        let actualSummary = this.stepStatus.statusSummary;

        if (!actualSummary) {
            actualSummary = {
                output_rows: 0,
                rows_success: 0,
                rows_failed: 0,
                rows_invalid: 0,
                rows_skipped: 0,
            }
        }

        if (adapterStatusSummary && adapterRunOptions?.onlyFailedEntities) {
            actualSummary.rows_success += adapterStatusSummary.rows_success
            actualSummary.rows_failed = adapterStatusSummary.rows_failed
        }

        return actualSummary
    }


    private canRetry(): boolean {
        return this.stepStatus.tryNumber <= this.stepDefinition.retartTries
    }

    async getStatus() {
        return this.stepStatus;
    }

}

export abstract class LocalStepDefinition implements StepDefinition {
    abstract readonly adapterDefinitionId: string;
    abstract readonly definitionType: string;
    abstract readonly id: string
    abstract readonly retartTries: number
    abstract isFailedStatus(statusSummary: StepStatusSummary): boolean
}
