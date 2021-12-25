import { cloneDeep } from "lodash";
import { AdapterFactory } from "../../adapters/factory";
import { AdapterDefinition, AdapterDependencies, AdapterRunnerRunOptions, AdapterStatusTag } from "../../adapters/types";
import { RegisterStatusSummary } from "../../registers/types";
import { Step, StepRunOptions, StepDefinition, StepStatusSummary } from "../types"
import { MyStepDependencies } from "./types";

/**
 * Local async step, persistance
 */
export class LocalStep<sd extends LocalStepDefinition> implements Step<sd>{

    public readonly stepDefinition: sd;
    private readonly adapterFactory: AdapterFactory;
    private readonly adapterDependencies: AdapterDependencies<AdapterDefinition>;

    constructor(dependencies: MyStepDependencies<sd>) {
        this.stepDefinition = dependencies.stepDefinition;
        this.adapterFactory = dependencies.adapterFactory;
        this.adapterDependencies = dependencies.adapterDependencies;
    }

    async run(runOptions: StepRunOptions) {
        runOptions = cloneDeep(runOptions)
        const adapterRunOptions = this.buildAdapterOptions(runOptions)
        const stepStatusSummary: StepStatusSummary = {
            registerStatusSummary: {
                output_rows: 0,
                rows_success: 0,
                rows_failed: 0,
                rows_invalid: 0,
                rows_skipped: 0,
            },
            tryNumber: 0,
            timeStarted: new Date(),
            timeFinished: null,
            isFailedStep: false,
        }
        await this.tryRunAdapter(stepStatusSummary, adapterRunOptions);
        stepStatusSummary.timeFinished = new Date();
        return cloneDeep(stepStatusSummary)
    }

    private async tryRunAdapter(stepStatusSummary: StepStatusSummary, adapterRunOptions?: AdapterRunnerRunOptions) {

        stepStatusSummary.tryNumber++

        try {
            const adapterRunner = this.adapterFactory.createAdapterRunner(this.stepDefinition.adapterDefinitionId, this.adapterDependencies)
            const adapterStatus = await adapterRunner.run(adapterRunOptions)
            const registerStatusSummary = adapterStatus.statusSummary;
            const stepRegisterStatusSummary = stepStatusSummary.registerStatusSummary;
            this.fillSummary(stepRegisterStatusSummary, registerStatusSummary, adapterRunOptions?.onlyFailedEntities)

            if (adapterStatus.statusTag == AdapterStatusTag.failed && this.canRetry(stepStatusSummary.tryNumber)) {
                const restartAdapterRunOptions = { ...adapterRunOptions, onlyFailedEntities: true }
                await this.tryRunAdapter(stepStatusSummary, restartAdapterRunOptions);
            }
            else {
                if (registerStatusSummary && registerStatusSummary.rows_failed > 0 && this.canRetry(stepStatusSummary.tryNumber)) {
                    const restartAdapterRunOptions = { ...adapterRunOptions, onlyFailedEntities: true }
                    await this.tryRunAdapter(stepStatusSummary, restartAdapterRunOptions);
                }
                else {
                    if (this.stepDefinition.isFailedStatus(stepRegisterStatusSummary)) {
                        stepStatusSummary.isFailedStep = true
                    }
                }
            }

        } catch (error: any) {
            if (this.canRetry(stepStatusSummary.tryNumber)) {
                await this.tryRunAdapter(stepStatusSummary, adapterRunOptions);
            }
            else {
                throw error
            }
        }
    }


    private fillSummary(stepStatusSummary: RegisterStatusSummary, adapterStatusSummary: RegisterStatusSummary, onlyFailedEntities?: boolean) {
        if (onlyFailedEntities) {
            stepStatusSummary.rows_success += adapterStatusSummary.rows_success
            stepStatusSummary.rows_failed = adapterStatusSummary.rows_failed
        } else {
            stepStatusSummary.rows_success = adapterStatusSummary.rows_success
            stepStatusSummary.rows_failed = adapterStatusSummary.rows_failed
            stepStatusSummary.rows_invalid = adapterStatusSummary.rows_invalid
            stepStatusSummary.rows_skipped = adapterStatusSummary.rows_skipped
            stepStatusSummary.output_rows = adapterStatusSummary.output_rows
        }
    }

    private buildAdapterOptions(stepOptions?: StepRunOptions): AdapterRunnerRunOptions {
        return {
            mockEntities: stepOptions?.mockEntities,
            syncContext: stepOptions?.syncContext
        }
    }

    private canRetry(tryNumber: number): boolean {
        return tryNumber <= this.stepDefinition.retartTries
    }
}

export abstract class LocalStepDefinition implements StepDefinition {
    abstract readonly adapterDefinitionId: string;
    //adapterDefinitionRunOptions
    abstract readonly definitionType: string;
    abstract readonly id: string
    abstract readonly retartTries: number
    abstract isFailedStatus(statusSummary: RegisterStatusSummary): boolean
}
