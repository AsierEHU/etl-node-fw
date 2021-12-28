import { AdapterRunnerRunOptions } from "../../adapters/types";
import { StepFactory } from "../../steps/factory"
import { StepStatusTag } from "../../steps/types"
import { Flow, FlowDefinition, FlowRunOptions, FlowStatusSummary } from "../types"

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
            timeStarted: new Date(),
            timeFinished: null,
            stepFailedId: null,
            stepsSuccess: 0,
            stepsTotal: this.flowDefinition.stepsDefinitionFlow.length
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
                if (stepStatus.statusTag == StepStatusTag.failed) {
                    flowStatusSummary.stepFailedId = stepDefinitionId;
                    break;
                } else {
                    flowStatusSummary.stepsSuccess++
                }
            } catch (error) {
                throw error
            }
        }
        flowStatusSummary.timeFinished = new Date()
        return flowStatusSummary
    }
}

export abstract class LocalFlowDefinition implements FlowDefinition {
    abstract readonly id: string
    abstract readonly definitionType: string;
    abstract readonly stepsDefinitionFlow: { id: string, runOptions?: AdapterRunnerRunOptions }[]
}
