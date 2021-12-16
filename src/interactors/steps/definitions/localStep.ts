import EventEmitter from "events";
import { AdapterFactory } from "../../adapters/factory";
import { AdapterDefinition, AdapterDependencies, AdapterRunOptions } from "../../adapters/types";
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
        await this.tryRunAdapter(this.stepStatus.runOptions?.adapterRunOptions);
        this.stepStatus.timeFinished = new Date();
        this.stepPresenter.emit("stepStatus", this.stepStatus)
        return this.stepStatus.statusTag;
    }

    private async tryRunAdapter(adapterRunOptions?: AdapterRunOptions, tryNumber?: number) {
        this.stepStatus.tryNumber = tryNumber || 1;
        const adapter = this.adapterFactory.createAdapter(this.stepDefinition.adapterDefinitionId, this.adapterDependencies)

        if (!this.stepStatus.statusSummary) {
            this.stepStatus.statusSummary = {
                output_rows: 0,
                rows_success: 0,
                rows_failed: 0,
                rows_invalid: 0,
                rows_skipped: 0
            }
        }

        try {
            const adapterStatusSummary = await adapter.runOnce(adapterRunOptions)
            if (adapterRunOptions?.onlyFailedEntities) {
                this.stepStatus.statusSummary.rows_success += adapterStatusSummary.rows_success
                this.stepStatus.statusSummary.rows_failed = adapterStatusSummary.rows_failed
            } else {
                this.stepStatus.statusSummary = adapterStatusSummary
            }

        } catch (error: any) {
            this.stepStatus.statusMeta = error.message
            if (this.canRetry()) {
                await this.tryRunAdapter(adapterRunOptions, this.stepStatus.tryNumber + 1);
            }
        }

        if (this.stepStatus.statusSummary.rows_failed > 0 && this.canRetry()) {
            const restartAdapterRunOptions = { ...adapterRunOptions, onlyFailedEntities: true }
            await this.tryRunAdapter(restartAdapterRunOptions, this.stepStatus.tryNumber + 1);
        }
        else {
            if (this.stepDefinition.isFailedStatus(this.stepStatus.statusSummary)) {
                this.stepStatus.statusTag = StepStatusTag.failed;
            } else {
                this.stepStatus.statusTag = StepStatusTag.success;
            }
        }
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
