import EventEmitter from "events";
import { AdapterBuilder } from "../../adapters/builder";
import { AdapterDefinition, AdapterRunOptions, AdapterStatusTag } from "../../adapters/types";
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
        let status = null;

        try {
            //Inject here step context into entitiesStorage to safe inside the step context?
            const adapter = this.adapterBuilder.buildAdapter(this.stepDefinition.adapterDefinition.id, this.adapterDependencies)
            status = await adapter.start(adapterRunOptions)
            this.stepStatus.statusTag = StepStatusTag.success;
        } catch (error: any) {
            status = AdapterStatusTag.failed
            this.stepStatus.statusMeta = error.message
        }

        if (this.stepStatus.tryNumber <= this.stepDefinition.retartTries && status == AdapterStatusTag.failed) {
            this.stepStatus.statusTag = StepStatusTag.failed;
            await this.tryRunAdapter(adapterRunOptions, this.stepStatus.tryNumber + 1);
        }

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