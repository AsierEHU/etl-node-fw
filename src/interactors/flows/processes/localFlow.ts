import { AdapterRunnerRunOptions } from "../../adapters/runners/types";
import { StepFactory } from "../../steps/factory"
import { StepStatusTag } from "../../steps/runners/types"
import { Flow, FlowDefinition, FlowRunOptions, FlowStatusSummary } from "./types"

/**
 * Lineal async flow, monolith, persistence
 */
export class LocalFlow<fd extends LocalFlowDefinition> implements Flow<fd> {

    public readonly flowDefinition: fd
    private readonly stepFactory: StepFactory;

    constructor(dependencies: any) {
        this.flowDefinition = dependencies.flowDefinition;
        this.stepFactory = dependencies.stepFactory;
    }

    async run(flowRunOptions: FlowRunOptions): Promise<FlowStatusSummary> {
        const flowStatusSummary: FlowStatusSummary = {
            stepsSuccess: 0,
            stepsTotal: this.flowDefinition.stepsDefinitionFlow.length,
            stepsFailed: 0,
            stepsInvalid: 0,
            stepsPending: this.flowDefinition.stepsDefinitionFlow.length,
        }
        const stepsDefinitionsFlows = this.flowDefinition.stepsDefinitionFlow
        for (const stepDefinitionFlow of stepsDefinitionsFlows) {
            const stepDefinitionId = stepDefinitionFlow.id
            const stepRunner = this.stepFactory.createStepRunner(stepDefinitionId)

            const stepRunnerInputRunOptions = flowRunOptions.stepsRunOptions?.filter(sro => sro.stepDefinitionId == stepDefinitionId)[0]
            let stepRunnerRunOptions = undefined;
            if (stepRunnerInputRunOptions || stepDefinitionFlow.runOptions) {
                stepRunnerRunOptions = { ...stepDefinitionFlow.runOptions, ...stepRunnerInputRunOptions?.runOptions };
            }

            try {
                const stepStatus = await stepRunner.run(stepRunnerRunOptions)
                flowStatusSummary.stepsPending--
                switch (stepStatus.statusTag) {
                    case StepStatusTag.failed:
                        flowStatusSummary.stepsFailed++;
                        break;
                    case StepStatusTag.success:
                        flowStatusSummary.stepsSuccess++;
                        break;
                    case StepStatusTag.invalid:
                        flowStatusSummary.stepsInvalid++;
                        break;
                }
                if (stepDefinitionFlow.successMandatory && stepStatus.statusTag != StepStatusTag.success)
                    break;

            } catch (error) {
                throw error
            }
        }

        return flowStatusSummary
    }
}

export abstract class LocalFlowDefinition implements FlowDefinition {
    abstract readonly id: string
    abstract readonly definitionType: string;
    abstract readonly stepsDefinitionFlow: { id: string, runOptions?: AdapterRunnerRunOptions, successMandatory?: boolean }[]
}
