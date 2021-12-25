import { cloneDeep } from "lodash";
import { AdapterFactory } from "../../adapters/factory";
import { AdapterDefinition, AdapterDependencies, AdapterRunnerRunOptions, AdapterStatusTag } from "../../adapters/types";
import { RegisterStatusSummary } from "../../registers/types";
import { Step, StepDefinition, StepStatusSummary } from "../types"
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

    async run(runOptions: AdapterRunnerRunOptions) {
        runOptions = cloneDeep(runOptions)

        const definitionRunOptions = this.stepDefinition.adapterDefinitionRunOptions
        if (definitionRunOptions) {
            runOptions.mockEntities = runOptions.mockEntities || definitionRunOptions.mockEntities
            runOptions.onlyFailedEntities = runOptions.onlyFailedEntities || definitionRunOptions.onlyFailedEntities
            runOptions.syncContext = runOptions.syncContext || definitionRunOptions.syncContext
        }

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
            failedStatusSummary: false,
        }
        await this.tryRunAdapter(stepStatusSummary, runOptions);
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
                        stepStatusSummary.failedStatusSummary = true
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

    private canRetry(tryNumber: number): boolean {
        return tryNumber <= this.stepDefinition.retartTries
    }
}

export abstract class LocalStepDefinition implements StepDefinition {
    abstract readonly adapterDefinitionRunOptions: AdapterRunnerRunOptions | null;
    abstract readonly adapterDefinitionId: string;
    abstract readonly definitionType: string;
    abstract readonly id: string
    abstract readonly retartTries: number
    abstract isFailedStatus(statusSummary: RegisterStatusSummary): boolean
}
