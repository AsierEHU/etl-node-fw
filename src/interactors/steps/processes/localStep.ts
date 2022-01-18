import { cloneDeep } from "lodash";
import { StatusTag } from "../../../business/processStatus";
import { SyncContext } from "../../../business/register";
import { AdapterFactory } from "../../adapters/factory";
import { AdapterRunOptions } from "../../adapters/processes/types";
import { AdapterSpecialIds, RegisterDataAccess, RegisterStats } from "../../registers/types";
import { getWithInitFormat, initRegisters } from "../../registers/utils";
import { AdvancedRegisterFetcher } from "../../registers/utilsDB";
import { LocalStepDefinition } from "../definitions/types";
import { Step, StepRunOptions } from "./types";

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
        const tryNumber = -1
        await this.tryRunAdapter(tryNumber, syncContext, adapterRunOptions || undefined);
    }

    private async tryRunAdapter(tryNumber: number, syncContext: SyncContext, adapterRunOptions?: AdapterRunOptions) {

        tryNumber = tryNumber + 1

        const adapterRunner = this.adapterFactory.createAdapterRunner(this.stepDefinition.adapterDefinitionId)
        const adapterStatus = await adapterRunner.run(syncContext, adapterRunOptions)
        const registerStats = adapterStatus.statusSummary as RegisterStats;

        if (adapterStatus.statusTag == StatusTag.failed && this.canRetry(tryNumber)) {
            const restartAdapterRunOptions = { ...adapterRunOptions, onlyFailedEntities: true }
            //TODO: maybe have to run all the entities, removing inconsistencies
            await this.tryRunAdapter(tryNumber, syncContext, restartAdapterRunOptions);
        }
        else {
            if (registerStats && registerStats.registers_failed > 0 && this.canRetry(tryNumber)) {
                const restartAdapterRunOptions = { ...adapterRunOptions, onlyFailedEntities: true }
                await this.tryRunAdapter(tryNumber, syncContext, restartAdapterRunOptions);
            }
            else {
                const arg = new AdvancedRegisterFetcher(this.registerDataAccess);
                const registerStats = await arg.getRegistersStepSummary(syncContext.stepId as string, true)
                const isInvalidRegistersSummary = this.stepDefinition.isInvalidRegistersSummary(registerStats)
                if (isInvalidRegistersSummary) {
                    throw new Error("Invalid by definition")
                }
            }
        }
    }


    private canRetry(tryNumber: number): boolean {
        return tryNumber < this.stepDefinition.maxRetries
    }
}
