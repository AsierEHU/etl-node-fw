import { FlowDefinition } from "./definitions/types"
import { LocalLinealFlow } from "./processes/localLinealFlow"
import { Flow } from "./processes/types"
import { LocalLinealFlowRunner } from "./runners/localLinealFlowRunner"
import { FlowRunner } from "./runners/types"


const frdt = {
    ["LocalLinealFlowRunner"]: {
        class: LocalLinealFlowRunner,
        dependencies: ["flowPresenter"],
    }
}

const fddt = {
    ["LocalLinealFlow"]: {
        class: LocalLinealFlow,
        dependencies: ["flowFactory", "registerDataAccess"],
        runner: frdt["LocalLinealFlowRunner"]
    },
}

const FlowDefinitionTree: { [key: string]: any } = {
    ["LocalLinealFlowDefinition"]: fddt["LocalLinealFlow"],
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

    private createFlow(definitionId: string): Flow<FlowDefinition> {
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

