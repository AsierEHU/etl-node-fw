import { cloneDeep } from "lodash";
import { AdapterFactory } from "../../adapters/factory";
import { AdapterRunOptions } from "../../adapters/processes/types";
import { AdapterStatusTag } from "../../adapters/runners/types";
import { RegisterDataAccess, RegisterStats, SyncContext } from "../../registers/types";
import { getWithInitFormat, initRegisters } from "../../registers/utils";
import { Step, StepStatusSummary, StepDefinition, StepRunOptions } from "./types";
/**
 * Local async step, persistance
 */
export class LocalStep<sd extends LocalStepDefinition> implements Step<sd>{

    public readonly stepDefinition: sd;
    private readonly adapterFactory: AdapterFactory;
    private readonly registerDataAccess: RegisterDataAccess

    constructor(dependencies: any) {
        this.stepDefinition = dependencies.stepDefinition;
        this.adapterFactory = dependencies.adapterFactory;
        this.registerDataAccess = dependencies.registerDataAccess
    }

    async run(syncContext: SyncContext, runOptions?: StepRunOptions) {
        runOptions = cloneDeep(runOptions)
        syncContext = cloneDeep(syncContext)

        let adapterRunOptions = this.stepDefinition.adapterRunOptions

        if (runOptions?.pushEntities) {
            const pushEntities = runOptions?.pushEntities || [];
            const inputEntitiesWithMeta = getWithInitFormat(pushEntities)
            const inputRegisters = initRegisters(inputEntitiesWithMeta, { ...syncContext })
            await this.registerDataAccess.saveAll(inputRegisters)
            adapterRunOptions = { ...adapterRunOptions, usePushedEntities: true }
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
            isInvalidRegistersSummary: false,
        }

        await this.tryRunAdapter(stepStatusSummary, syncContext, adapterRunOptions || undefined);

        return cloneDeep(stepStatusSummary)
    }

    private async tryRunAdapter(stepStatusSummary: StepStatusSummary, syncContext: SyncContext, adapterRunOptions?: AdapterRunOptions) {

        stepStatusSummary.tryNumber++

        try {
            const adapterRunner = this.adapterFactory.createAdapterRunner(this.stepDefinition.adapterDefinitionId)
            const adapterStatus = await adapterRunner.run(syncContext, adapterRunOptions)
            const registerStats = adapterStatus.statusSummary as RegisterStats;
            const stepRegisterStatusSummary = stepStatusSummary.registerStats;
            this.fillSummary(stepRegisterStatusSummary, registerStats, adapterRunOptions?.onlyFailedEntities)

            if (adapterStatus.statusTag == AdapterStatusTag.failed && this.canRetry(stepStatusSummary.tryNumber)) {
                const restartAdapterRunOptions = { ...adapterRunOptions, onlyFailedEntities: true }
                await this.tryRunAdapter(stepStatusSummary, syncContext, restartAdapterRunOptions);
            }
            else {
                if (registerStats && registerStats.registers_failed > 0 && this.canRetry(stepStatusSummary.tryNumber)) {
                    const restartAdapterRunOptions = { ...adapterRunOptions, onlyStepFailedEntities: true }
                    await this.tryRunAdapter(stepStatusSummary, syncContext, restartAdapterRunOptions);
                }
                else {
                    stepStatusSummary.isInvalidRegistersSummary = this.stepDefinition.isInvalidRegistersSummary(stepRegisterStatusSummary)
                }
            }

        } catch (error: any) {
            if (this.canRetry(stepStatusSummary.tryNumber)) {
                await this.tryRunAdapter(stepStatusSummary, syncContext, adapterRunOptions);
            }
            else {
                throw error
            }
        }
    }


    private fillSummary(stepStatusSummary: RegisterStats, adapterStatusSummary: RegisterStats, onlyStepFailedEntities?: boolean) {
        if (onlyStepFailedEntities) {
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
    abstract readonly adapterRunOptions: AdapterRunOptions | null;
    abstract readonly adapterDefinitionId: string;
    abstract readonly definitionType: string;
    abstract readonly id: string
    abstract readonly retartTries: number
    abstract isInvalidRegistersSummary(statusSummary: RegisterStats): boolean
}