import { cloneDeep } from "lodash";
import { AdapterFactory } from "../../adapters/factory";
import { AdapterRunnerRunOptions, AdapterStatusTag } from "../../adapters/runners/types";
import { RegisterStats } from "../../registers/types";
import { Step, StepStatusSummary, StepDefinition } from "./types";
/**
 * Local async step, persistance
 */
export class LocalStep<sd extends LocalStepDefinition> implements Step<sd>{

    public readonly stepDefinition: sd;
    private readonly adapterFactory: AdapterFactory;

    constructor(dependencies: any) {
        this.stepDefinition = dependencies.stepDefinition;
        this.adapterFactory = dependencies.adapterFactory;
    }

    async run(runOptions: AdapterRunnerRunOptions) {
        runOptions = cloneDeep(runOptions)

        const definitionRunOptions = this.stepDefinition.adapterDefinitionRunOptions
        if (definitionRunOptions) {
            runOptions.pushEntities = runOptions.pushEntities || definitionRunOptions.pushEntities
            runOptions.onlyFailedEntities = runOptions.onlyFailedEntities || definitionRunOptions.onlyFailedEntities
            runOptions.syncContext = runOptions.syncContext || definitionRunOptions.syncContext
        }

        const stepStatusSummary: StepStatusSummary = {
            registerStats: {
                registers_total: 0,
                registers_success: 0,
                registers_failed: 0,
                registers_invalid: 0,
                registers_skipped: 0,
            },
            tryNumber: 0,
            isInvalid: false,
        }
        await this.tryRunAdapter(stepStatusSummary, runOptions);
        return cloneDeep(stepStatusSummary)
    }

    private async tryRunAdapter(stepStatusSummary: StepStatusSummary, adapterRunOptions?: AdapterRunnerRunOptions) {

        stepStatusSummary.tryNumber++

        try {
            const adapterRunner = this.adapterFactory.createAdapterRunner(this.stepDefinition.adapterDefinitionId)
            const adapterStatus = await adapterRunner.run(adapterRunOptions)
            const registerStats = adapterStatus.statusSummary as RegisterStats;
            const stepRegisterStatusSummary = stepStatusSummary.registerStats;
            this.fillSummary(stepRegisterStatusSummary, registerStats, adapterRunOptions?.onlyFailedEntities)

            if (adapterStatus.statusTag == AdapterStatusTag.failed && this.canRetry(stepStatusSummary.tryNumber)) {
                const restartAdapterRunOptions = { ...adapterRunOptions, onlyFailedEntities: true }
                await this.tryRunAdapter(stepStatusSummary, restartAdapterRunOptions);
            }
            else {
                if (registerStats && registerStats.registers_failed > 0 && this.canRetry(stepStatusSummary.tryNumber)) {
                    const restartAdapterRunOptions = { ...adapterRunOptions, onlyFailedEntities: true }
                    await this.tryRunAdapter(stepStatusSummary, restartAdapterRunOptions);
                }
                else {
                    if (this.stepDefinition.isInvalid(stepRegisterStatusSummary)) {
                        stepStatusSummary.isInvalid = true
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


    private fillSummary(stepStatusSummary: RegisterStats, adapterStatusSummary: RegisterStats, onlyFailedEntities?: boolean) {
        if (onlyFailedEntities) {
            stepStatusSummary.registers_success += adapterStatusSummary.registers_success
            stepStatusSummary.registers_failed = adapterStatusSummary.registers_failed
        } else {
            stepStatusSummary.registers_success = adapterStatusSummary.registers_success
            stepStatusSummary.registers_failed = adapterStatusSummary.registers_failed
            stepStatusSummary.registers_invalid = adapterStatusSummary.registers_invalid
            stepStatusSummary.registers_skipped = adapterStatusSummary.registers_skipped
            stepStatusSummary.registers_total = adapterStatusSummary.registers_total
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
    abstract isInvalid(statusSummary: RegisterStats): boolean
}
