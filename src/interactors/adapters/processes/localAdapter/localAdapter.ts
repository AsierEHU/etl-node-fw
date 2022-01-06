import { cloneDeep } from "lodash";
import { RegisterDataAccess, Register, RegisterStatusTag, SyncContext, reservedRegisterEntityTypes, AdapterSpecialIds } from "../../../registers/types";
import { buildRegisterFromOthers } from "../../../registers/utils";
import { AdvancedRegisterFetcher } from "../../../registers/utilsDB";
import { AdapterDefinition, Adapter, AdapterRunOptions } from "../types";


/**
 * Local adapter
 * Persistance registers
 * row-by-row
 * Throw excepcion on unexpected error (all records fail)
 * Check failed on handle error (1 record fails)
 */
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
        const registers = await this.getInitialRegisters(syncContext, runOptions);
        await this.processRegisters(registers, syncContext);
    }

    private async getInitialRegisters(syncContext: SyncContext, runOptions?: AdapterRunOptions): Promise<Register[]> {
        let registers = [];
        if (runOptions?.onlyFailedEntities) {
            const failedRegisters = await this.registerDataAccess.getAll({
                registerType: this.adapterDefinition.outputType,
                registerStatus: RegisterStatusTag.failed,
                stepId: syncContext.stepId,
                flowId: syncContext.flowId
            })
            const arg = new AdvancedRegisterFetcher(this.registerDataAccess);
            const oldInputRegisters = await arg.getRelativeRegisters(failedRegisters)
            registers = buildRegisterFromOthers(oldInputRegisters, syncContext, this.adapterDefinition.outputType)
        }
        else if (runOptions?.usePushedEntityTypes) {
            let pushedRegisters: Register[] = [];
            for (const entityType of runOptions?.usePushedEntityTypes) {
                const pushedRegistersInType = await this.registerDataAccess.getAll(
                    {
                        registerType: entityType,
                        stepId: syncContext.stepId,
                        flowId: syncContext.flowId,
                        adapterId: AdapterSpecialIds.pushEntity
                    }
                )
                pushedRegisters = [...pushedRegisters, ...pushedRegistersInType]
            }
            registers = buildRegisterFromOthers(pushedRegisters, syncContext)
        }
        else {
            registers = await this.getRegisters(syncContext)
        }

        return cloneDeep(registers);
    }

    protected abstract getRegisters(syncContext: SyncContext): Promise<Register[]>

    protected abstract processRegisters(registers: Register[], syncContext: SyncContext): Promise<void>

}
