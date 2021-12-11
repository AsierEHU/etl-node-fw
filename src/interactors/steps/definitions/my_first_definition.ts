import EventEmitter from "events";
import { AdapterBuilder } from "../../adapters/builder";
import { AdapterDefinition, AdapterDependencies, AdapterRunOptions, AdapterStatusSummary } from "../../adapters/types";
import { RegisterDataContext } from "../../registers/types";
import { Step, StepStatus, StepDefinition, StepStatusTag, StepRunOptions, StepDependencies } from "../types"


/**
 * Local async step, persistance
 */
export class MyStep<sd extends MyStepDefinition> implements Step<sd>{

    private readonly stepDefinition: sd;
    private readonly adapterBuilder: AdapterBuilder;
    private readonly stepStatus: StepStatus;
    private readonly stepPresenter: EventEmitter;
    private readonly adapterDependencies: AdapterDependencies<AdapterDefinition>;
    protected readonly syncUpperContext: RegisterDataContext

    constructor(dependencies: MyStepDependencies<sd>) {
        this.stepDefinition = dependencies.stepDefinition;
        this.adapterBuilder = dependencies.adapterBuilder;
        this.stepPresenter = dependencies.stepPresenter;
        this.syncUpperContext = dependencies.syncContext;
        const id = Math.random().toString();
        this.stepStatus = {
            id,
            definitionId: this.stepDefinition.id,
            definitionType: this.stepDefinition.definitionType,
            statusTag: StepStatusTag.pending,
            tryNumber: 0,
            statusMeta: null,
            timeStarted: null,
            timeFinished: null,
            meta: null,
            syncContext: { ...this.syncUpperContext, stepId: id }
        }
        this.adapterDependencies = dependencies.adapterDependencies;
        this.adapterDependencies.syncContext = this.stepStatus.syncContext;
        this.stepPresenter.emit("stepStatus", this.stepStatus)
    }

    async start(runOptions?: StepRunOptions) {
        this.stepStatus.timeStarted = new Date();
        this.stepStatus.statusTag = StepStatusTag.active
        this.stepStatus.meta = { runOptions };
        this.stepPresenter.emit("stepStatus", this.stepStatus)
        await this.tryRunAdapter(runOptions?.adapterRunOptions);
        this.stepStatus.timeFinished = new Date();
        this.stepPresenter.emit("stepStatus", this.stepStatus)
        return this.stepStatus.statusTag;
    }

    private async tryRunAdapter(adapterRunOptions?: AdapterRunOptions, tryNumber?: number) {
        this.stepStatus.tryNumber = tryNumber || 1;
        let statusSummary: AdapterStatusSummary = {
            output_rows: 0,
            rows_success: 0,
            rows_failed: 0,
            rows_invalid: 0,
            rows_skipped: 0
        };
        const adapter = this.adapterBuilder.buildAdapter(this.stepDefinition.adapterDefinitionId, this.adapterDependencies)

        try {
            //TODO: same adapter or other adapter?
            statusSummary = await adapter.start(adapterRunOptions)
        } catch (error: any) {
            this.stepStatus.statusMeta = error.message
            if (this.shouldRetry()) {
                await this.tryRunAdapter(adapterRunOptions, this.stepStatus.tryNumber + 1);
            }
        }

        if (this.shouldRestartFailedEntities(statusSummary)) {
            if (adapterRunOptions) {
                adapterRunOptions.onlyFailedEntities = true;
            } else {
                adapterRunOptions = {
                    onlyFailedEntities: true
                }
            }
            await this.tryRunAdapter(adapterRunOptions, this.stepStatus.tryNumber + 1);
        }
        else {
            if (this.stepDefinition.isFailedStatus(statusSummary)) {
                this.stepStatus.statusTag = StepStatusTag.failed;
            } else {
                this.stepStatus.statusTag = StepStatusTag.success;
            }
        }
    }

    private shouldRestartFailedEntities(statusSummary: AdapterStatusSummary): boolean {
        if (statusSummary.rows_failed > 0 && this.shouldRetry())
            return true
        return false
    }

    private shouldRetry(): boolean {
        return this.stepStatus.tryNumber <= this.stepDefinition.retartTries
    }

    async getStatus() {
        return this.stepStatus;
    }

}

export abstract class MyStepDefinition implements StepDefinition {
    abstract readonly adapterDefinitionId: string;
    abstract readonly definitionType: string;
    abstract readonly id: string
    abstract readonly retartTries: number
    abstract isFailedStatus(statusSummary: AdapterStatusSummary): boolean
}


/**
 * Utils
 */

export interface StepDataAccess {
    save: (stepStatus: StepStatus) => Promise<void>
    get: (id: string) => Promise<StepStatus>
}

export interface MyStepDependencies<sp extends MyStepDefinition> extends StepDependencies<sp> {
    adapterBuilder: AdapterBuilder
    stepPresenter: EventEmitter
    adapterDependencies: any
}