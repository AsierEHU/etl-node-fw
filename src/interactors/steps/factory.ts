import { LocalStep } from "./definitions/localStep";
import { LocalStepRunner } from "./runners/localStepRunner";
import { Step, StepDefinition, StepRunner } from "./types"

export class StepFactory {
    private readonly stepDefinitionsMap: { [key: string]: StepDefinition }

    constructor(stepDefinitions: Array<StepDefinition>) {
        this.stepDefinitionsMap = {}
        for (const stepDefinition of stepDefinitions) {
            if (this.stepDefinitionsMap[stepDefinition.id])
                throw new Error(`Adapter with id ${stepDefinition.id} already exist`);
            this.stepDefinitionsMap[stepDefinition.id] = stepDefinition
        }
    }

    public createStep(definitionId: string, dependencies: any): Step<StepDefinition> {
        const stepDefinition = this.stepDefinitionsMap[definitionId];
        if (!stepDefinition) {
            throw Error("Not step match with definition id: " + definitionId)
        }

        const stepDependencies = dependencies;
        stepDependencies.stepDefinition = stepDefinition;

        if (stepDefinition.definitionType == "LocalStepDefinition") {
            return new LocalStep(stepDependencies);
        }
        else {
            throw Error("Not step match with definition type: " + stepDefinition.definitionType)
        }
    }

    public createStepRunner(definitionId: string, dependencies: any): StepRunner {
        const stepDefinition = this.stepDefinitionsMap[definitionId];
        if (!stepDefinition) {
            throw Error("Not step match with definition id: " + definitionId)
        }

        const stepRunnerDependencies = dependencies;
        stepRunnerDependencies.step = this.createStep(definitionId, dependencies);

        if (stepDefinition.definitionType == "LocalStepDefinition") {
            return new LocalStepRunner(stepRunnerDependencies)
        }
        else {
            throw Error("Not step match with definition type: " + stepDefinition.definitionType)
        }
    }
}

