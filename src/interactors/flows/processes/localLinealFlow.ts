
import { cloneDeep } from "lodash";
import { StatusTag } from "../../../business/processStatus";
import { ReservedEntityTypes, SyncContext } from "../../../business/register";
import { getWithInitFormat } from "../../adapters/processes/localAdapter/utils";
import { RegisterDataAccess } from "../../common/registers";
import { initRegisters } from "../../../business/registerUtils";
import { StepFactory } from "../../steps/factory"
import { LocalLinealFlowDefinition } from "../definitions/types";
import { Flow, FlowRunOptions } from "./types"

export class LocalLinealFlow<fd extends LocalLinealFlowDefinition> implements Flow<fd> {

    public readonly flowDefinition: fd
    private readonly stepFactory: StepFactory;
    private readonly registerDataAccess: RegisterDataAccess

    constructor(dependencies: any) {
        this.flowDefinition = dependencies.flowDefinition;
        this.stepFactory = dependencies.stepFactory;
        this.registerDataAccess = dependencies.registerDataAccess;
    }

    async run(syncContext: SyncContext, flowRunOptions?: FlowRunOptions): Promise<void> {
        flowRunOptions = cloneDeep(flowRunOptions)
        syncContext = cloneDeep(syncContext)

        if (flowRunOptions?.flowConfig) {
            const pushConfig = flowRunOptions?.flowConfig;
            const inputEntitiesWithMeta = getWithInitFormat(
                [pushConfig],
                ReservedEntityTypes.flowConfig,
                this.flowDefinition.id)
            const inputRegisters = initRegisters(inputEntitiesWithMeta, syncContext)
            await this.registerDataAccess.saveAll(inputRegisters)
        }

        const stepsDefinitionsFlows = this.flowDefinition.stepsDefinitionFlow
        for (const stepDefinitionFlow of stepsDefinitionsFlows) {
            const stepDefinitionId = stepDefinitionFlow.id
            const stepRunner = this.stepFactory.createStepRunner(stepDefinitionId)

            const flowStepRunOptions = flowRunOptions?.stepsRunOptions?.filter(sro => sro.stepDefinitionId == stepDefinitionId)[0] || undefined
            let stepRunOptions = undefined;
            if (flowStepRunOptions || stepDefinitionFlow.runOptions) {
                stepRunOptions = { ...stepDefinitionFlow.runOptions, ...flowStepRunOptions?.runOptions };
            }

            const stepStatus = await stepRunner.run(syncContext, stepRunOptions)
            if (stepDefinitionFlow.successMandatory && stepStatus.statusTag != StatusTag.success)
                throw new Error(`Step ${stepDefinitionFlow.id} is mandatory success, but finished with status ${stepStatus.statusTag}`)
        }
    }
}
