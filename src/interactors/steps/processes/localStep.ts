import { cloneDeep } from "lodash";
import { AdapterFactory } from "../../adapters/factory";
import { AdapterRunOptions } from "../../adapters/processes/types";
import { AdapterStatusTag } from "../../adapters/runners/types";
import { AdapterSpecialIds, RegisterDataAccess, RegisterStats, reservedEntityTypes, SyncContext } from "../../registers/types";
import { getWithInitFormat, initRegisters } from "../../registers/utils";
import { LocalStepDefinition } from "../definitions/types";
import { Step, StepStatusSummary, StepRunOptions } from "./types";

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
            const pushEntityTypes = Object.keys(runOptions?.pushEntities)
            for (const pushEntityType of pushEntityTypes) {
                const pushEntities = runOptions?.pushEntities[pushEntityType]
                const inputEntitiesWithMeta = getWithInitFormat(
                    pushEntities,
                    pushEntityType,
                    this.stepDefinition.id
                )
                const inputRegisters = initRegisters(inputEntitiesWithMeta, { ...syncContext, adapterId: AdapterSpecialIds.pushEntity })
                await this.registerDataAccess.saveAll(inputRegisters)
            }
            adapterRunOptions = { ...adapterRunOptions, usePushedEntityTypes: pushEntityTypes }
        }

        const stepStatusSummary: StepStatusSummary = {
            registerStats: {
                registers_total: 0,
                registers_success: 0,
                registers_failed: 0,
                registers_invalid: 0,
                registers_skipped: 0,
            },
            retries: -1,
            isInvalidRegistersSummary: false,
        }

        await this.tryRunAdapter(stepStatusSummary, syncContext, adapterRunOptions || undefined);

        return cloneDeep(stepStatusSummary)
    }

    private async tryRunAdapter(stepStatusSummary: StepStatusSummary, syncContext: SyncContext, adapterRunOptions?: AdapterRunOptions) {

        stepStatusSummary.retries++

        try {
            const adapterRunner = this.adapterFactory.createAdapterRunner(this.stepDefinition.adapterDefinitionId)
            const adapterStatus = await adapterRunner.run(syncContext, adapterRunOptions)
            const registerStats = adapterStatus.statusSummary as RegisterStats;
            const stepRegisterStatusSummary = stepStatusSummary.registerStats;
            this.fillSummary(stepRegisterStatusSummary, registerStats, adapterRunOptions?.onlyFailedEntities)

            if (adapterStatus.statusTag == AdapterStatusTag.failed && this.canRetry(stepStatusSummary.retries)) {
                const restartAdapterRunOptions = { ...adapterRunOptions, onlyFailedEntities: true }
                await this.tryRunAdapter(stepStatusSummary, syncContext, restartAdapterRunOptions);
            }
            else {
                if (registerStats && registerStats.registers_failed > 0 && this.canRetry(stepStatusSummary.retries)) {
                    const restartAdapterRunOptions = { ...adapterRunOptions, onlyStepFailedEntities: true }
                    await this.tryRunAdapter(stepStatusSummary, syncContext, restartAdapterRunOptions);
                }
                else {
                    stepStatusSummary.isInvalidRegistersSummary = this.stepDefinition.isInvalidRegistersSummary(stepRegisterStatusSummary)
                }
            }

        } catch (error: any) {
            if (this.canRetry(stepStatusSummary.retries)) {
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

    private canRetry(retries: number): boolean {
        return retries < this.stepDefinition.maxRetries
    }
}
