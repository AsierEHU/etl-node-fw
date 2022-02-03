import { cloneDeep } from "lodash";
import { SyncContext, Register, RegisterStatusTag, AdapterSpecialIds } from "../../../../business/register";
import { AdvancedRegisterFetcher, RegisterDataAccess } from "../../../common/registers";
import { AdapterDefinition } from "../../definitions/types";
import { Adapter, AdapterRunOptions } from "../types";

export abstract class LocalAdapter<ad extends AdapterDefinition> implements Adapter<ad>{

    public readonly adapterDefinition: ad;
    protected readonly registerDataAccess: RegisterDataAccess;

    constructor(dependencies: any) {
        this.adapterDefinition = dependencies.adapterDefinition;
        this.registerDataAccess = dependencies.registerDataAccess;
    }

    async run(syncContext: SyncContext, runOptions?: AdapterRunOptions) {
        runOptions = cloneDeep(runOptions)
        syncContext = cloneDeep(syncContext)
        const registers = await this.buildInitialRegisters(syncContext, runOptions);
        await this.processRegisters(registers, syncContext, runOptions);
    }

    private async buildInitialRegisters(syncContext: SyncContext, runOptions?: AdapterRunOptions): Promise<Register[]> {
        let registers = [];
        if (runOptions?.onlyFailedEntities) {
            const failedRegisters = await this.registerDataAccess.getAll({
                entityType: this.adapterDefinition.outputType,
                registerStatus: RegisterStatusTag.failed,
                stepId: syncContext.stepId,
                flowId: syncContext.flowId
            })
            const arg = new AdvancedRegisterFetcher(this.registerDataAccess);
            const oldInputRegisters = await arg.getRelativeRegisters(failedRegisters)
            registers = oldInputRegisters
        }
        else if (runOptions?.usePushedEntityTypes) {
            let pushedRegisters: Register[] = [];
            for (const entityType of runOptions?.usePushedEntityTypes) {
                const pushedRegistersInType = await this.registerDataAccess.getAll(
                    {
                        entityType: entityType,
                        stepId: syncContext.stepId,
                        flowId: syncContext.flowId,
                        adapterId: AdapterSpecialIds.pushEntity
                    }
                )
                pushedRegisters = [...pushedRegisters, ...pushedRegistersInType]
            }
            registers = pushedRegisters
        }
        else {
            registers = await this.getRegisters(syncContext)
        }

        return cloneDeep(registers);
    }

    protected abstract getRegisters(syncContext: SyncContext): Promise<Register[]>

    protected abstract processRegisters(registers: Register[], syncContext: SyncContext, runOptions?: AdapterRunOptions): Promise<void>

}
