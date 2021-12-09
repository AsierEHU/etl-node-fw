import EventEmitter from "events";
import { AdapterBuilder } from "../../adapters/builder";
import { AdapterDefinition, AdapterRunOptions, AdapterStatusSummary } from "../../adapters/types";
import { Step, StepStatus, StepDefinition, StepStatusTag, StepRunOptions } from "../types"


/**
 * Local async step, persistance
 */
export class MyStep<sd extends MyStepDefinition> implements Step<sd>{

    private readonly stepDefinition: sd;
    private readonly adapterBuilder: AdapterBuilder;
    private readonly stepStatus: StepStatus;
    private readonly stepPresenter: EventEmitter;
    private readonly adapterDependencies: any;

    constructor(dependencies: MyStepDependencies<sd>) {
        this.stepDefinition = dependencies.stepDefinition;
        this.adapterBuilder = dependencies.adapterBuilder;
        this.stepPresenter = dependencies.stepPresenter;
        this.adapterDependencies = dependencies.adapterDependencies;
        this.stepStatus = {
            id: Math.random().toString(),
            definitionId: this.stepDefinition.id,
            definitionType: this.stepDefinition.definitionType,
            statusTag: StepStatusTag.pending,
            tryNumber: 0,
            statusMeta: null,
            timeStarted: null,
            timeFinished: null,
            meta: null
        }
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

        try {
            //TODO: Inject here step context into entitiesStorage to safe inside the step context?
            //TODO: Add run only with failed records
            //TODO: same adapter or other adapter?
            const adapter = this.adapterBuilder.buildAdapter(this.stepDefinition.adapterDefinition.id, this.adapterDependencies)
            statusSummary = await adapter.start(adapterRunOptions)
        } catch (error: any) {
            this.stepStatus.statusMeta = error.message
        }

        if (this.shouldRestart(statusSummary) && this.stepStatus.tryNumber <= this.stepDefinition.retartTries) {
            await this.tryRunAdapter(adapterRunOptions, this.stepStatus.tryNumber + 1);
        }
        else {
            if (this.isFailedStatus(statusSummary)) {
                this.stepStatus.statusTag = StepStatusTag.failed;
            } else {
                this.stepStatus.statusTag = StepStatusTag.success;
            }
        }

    }

    private shouldRestart(statusSummary: AdapterStatusSummary): boolean {
        if (statusSummary.rows_failed > 0)
            return true
        return false
    }

    private isFailedStatus(statusSummary: AdapterStatusSummary): boolean {
        //TODO: flexible configuration about what is failed
        //default
        if (statusSummary.rows_failed > 0)
            return true
        return false
    }

    async getStatus() {
        return this.stepStatus;
    }

}

export abstract class MyStepDefinition implements StepDefinition {
    abstract readonly definitionType: string;
    abstract readonly id: string
    abstract readonly retartTries: number
    abstract readonly adapterDefinition: AdapterDefinition
}


/**
 * Utils
 */

export interface StepDataAccess {
    save: (stepStatus: StepStatus) => Promise<void>
    get: (id: string) => Promise<StepStatus>
}

export type MyStepDependencies<sp extends MyStepDefinition> = {
    stepDefinition: sp
    adapterBuilder: AdapterBuilder
    stepPresenter: EventEmitter
    adapterDependencies: any
}