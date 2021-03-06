import { StepDefinition } from "./definitions/types"
import { LocalStep } from "./processes/localStep"
import { Step } from "./processes/types"
import { LocalStepRunner } from "./runners/localStepRunner"
import { StepRunner } from "./runners/types"

const srdt = {
    ["LocalStepRunner"]: {
        class: LocalStepRunner,
        dependencies: ["adapterPresenter", "registerDataAccess", "processStatusDataAccess"],
    }
}

const sddt = {
    ["LocalStep"]: {
        class: LocalStep,
        dependencies: ["adapterFactory", "registerDataAccess"],
        runner: srdt["LocalStepRunner"]
    },
}

const StepDefinitionTree: { [key: string]: any } = {
    ["LocalStepDefinition"]: sddt["LocalStep"],
}

export class StepFactory {

    private readonly stepDefinitionsMap: { [key: string]: StepDefinition }
    private readonly stepGlobalDependencies: any

    constructor(stepDefinitions: Array<StepDefinition>, dependencies: any) {
        this.stepDefinitionsMap = {}
        for (const stepDefinition of stepDefinitions) {
            if (this.stepDefinitionsMap[stepDefinition.id])
                throw new Error(`Step with id ${stepDefinition.id} already exist`);
            this.stepDefinitionsMap[stepDefinition.id] = stepDefinition
        }
        this.stepGlobalDependencies = dependencies
    }

    private createStep(definitionId: string): Step<StepDefinition> {
        const stepDefinition = this.stepDefinitionsMap[definitionId];
        if (!stepDefinition) {
            throw Error("Not step match with definition id: " + definitionId)
        }

        const stepDependencies = { ...this.stepGlobalDependencies };
        stepDependencies.stepDefinition = stepDefinition;

        const stepDefinitionType = stepDefinition.definitionType;
        const stepBuildOptions = StepDefinitionTree[stepDefinitionType];

        if (stepBuildOptions) {
            return new stepBuildOptions.class(stepDependencies)
        }
        else {
            throw Error("Not step match with definition type: " + stepDefinition.definitionType)
        }
    }

    public createStepRunner(definitionId: string): StepRunner {
        const stepDefinition = this.stepDefinitionsMap[definitionId];
        if (!stepDefinition) {
            throw Error("Not step match with definition id: " + definitionId)
        }

        const stepRunnerDependencies = { ...this.stepGlobalDependencies };
        stepRunnerDependencies.step = this.createStep(definitionId);

        const stepDefinitionType = stepDefinition.definitionType;
        const stepRunnerBuildOptions = StepDefinitionTree[stepDefinitionType].runner;

        if (stepRunnerBuildOptions) {
            return new stepRunnerBuildOptions.class(stepRunnerDependencies)
        }
        else {
            throw Error("Not step match with definition type: " + stepDefinition.definitionType)
        }
    }
}

