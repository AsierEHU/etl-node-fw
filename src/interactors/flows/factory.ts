import { LocalFlow } from "./definitions/localFlow"
import { LocalFlowRunner } from "./runners/localFlowRunner"
import { Flow, FlowDefinition, FlowRunner } from "./types"

const frdt = {
    ["LocalFlowRunner"]: {
        class: LocalFlowRunner,
        dependencies: ["flowPresenter"],
    }
}

const fddt = {
    ["LocalFlow"]: {
        class: LocalFlow,
        dependencies: ["flowFactory"],
        runner: frdt["LocalFlowRunner"]
    },
}

const FlowDefinitionTree: { [key: string]: any } = {
    ["LocalFlowDefinition"]: fddt["LocalFlow"],
}

export class FlowFactory {

    private readonly flowDefinitionsMap: { [key: string]: FlowDefinition }
    private readonly flowGlobalDependencies: any

    constructor(flowDefinitions: Array<FlowDefinition>, dependencies: any) {
        this.flowDefinitionsMap = {}
        for (const flowDefinition of flowDefinitions) {
            if (this.flowDefinitionsMap[flowDefinition.id])
                throw new Error(`Flow with id ${flowDefinition.id} already exist`);
            this.flowDefinitionsMap[flowDefinition.id] = flowDefinition
        }
        this.flowGlobalDependencies = dependencies
    }

    public createFlow(definitionId: string): Flow<FlowDefinition> {
        const flowDefinition = this.flowDefinitionsMap[definitionId];
        if (!flowDefinition) {
            throw Error("Not flow match with definition id: " + definitionId)
        }

        const flowDependencies = { ...this.flowGlobalDependencies };
        flowDependencies.flowDefinition = flowDefinition;

        const flowDefinitionType = flowDefinition.definitionType;
        const flowBuildOptions = FlowDefinitionTree[flowDefinitionType];

        if (flowBuildOptions) {
            return new flowBuildOptions.class(flowDependencies)
        }
        else {
            throw Error("Not flow match with definition type: " + flowDefinition.definitionType)
        }
    }

    public createFlowRunner(definitionId: string): FlowRunner {
        const flowDefinition = this.flowDefinitionsMap[definitionId];
        if (!flowDefinition) {
            throw Error("Not flow match with definition id: " + definitionId)
        }

        const flowRunnerDependencies = { ...this.flowGlobalDependencies };
        flowRunnerDependencies.flow = this.createFlow(definitionId);

        const flowDefinitionType = flowDefinition.definitionType;
        const flowRunnerBuildOptions = FlowDefinitionTree[flowDefinitionType].runner;

        if (flowRunnerBuildOptions) {
            return new flowRunnerBuildOptions.class(flowRunnerDependencies)
        }
        else {
            throw Error("Not flow match with definition type: " + flowDefinition.definitionType)
        }
    }
}

