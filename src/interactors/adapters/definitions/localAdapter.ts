import { Register, SyncContext, RegisterStatusTag, RegisterDataAccess } from "../../registers/types";
import { Adapter, AdapterDefinition, AdapterRunOptions } from "../types"
import { MyAdapterDependencies } from "./types";
import { cloneDeep } from 'lodash'
import { AdvancedRegisterFetcher } from "../../registers/utilsDB";
import { buildRegisterFromOthers } from "../../registers/utils";




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

    constructor(dependencies: MyAdapterDependencies<ad>) {
        this.adapterDefinition = dependencies.adapterDefinition;
        this.registerDataAccess = dependencies.registerDataAccess;
    }

    async run(runOptions: AdapterRunOptions) {
        runOptions = cloneDeep(runOptions)
        const registers = await this.getInitialRegisters(runOptions);
        await this.processRegisters(registers, runOptions);
    }

    private async getInitialRegisters(runOptions: AdapterRunOptions): Promise<Register[]> {
        let registers = [];
        if (runOptions?.onlyFailedEntities) {
            const failedRegisters = await this.registerDataAccess.getAll({
                registerType: this.adapterDefinition.outputType,
                registerStatus: RegisterStatusTag.failed,
                stepId: runOptions.syncContext.stepId
            })
            const arg = new AdvancedRegisterFetcher(this.registerDataAccess);
            const oldInputRegisters = await arg.getRelativeRegisters(failedRegisters)
            registers = buildRegisterFromOthers(oldInputRegisters, runOptions.syncContext, this.adapterDefinition.outputType)
        }
        else if (runOptions?.useMockedEntities) {
            const mockedRegisters = await this.registerDataAccess.getAll(
                {
                    registerType: "$inputMocked",
                    stepId: runOptions.syncContext.stepId
                }
            )
            registers = buildRegisterFromOthers(mockedRegisters, runOptions.syncContext, this.adapterDefinition.outputType)
        }
        else {
            registers = await this.getRegisters(runOptions.syncContext)
        }

        return cloneDeep(registers);
    }

    protected abstract getRegisters(syncContext: SyncContext): Promise<Register[]>

    protected abstract processRegisters(registers: Register[], runOptions: AdapterRunOptions): Promise<void>

}
