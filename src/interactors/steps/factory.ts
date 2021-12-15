import { MyStep } from "./definitions/myFirstDefinition/my_first_definition";
import { Step, StepDefinition } from "./types"

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

        if (stepDefinition.definitionType == "MyStepDefinition") {
            return new MyStep(stepDependencies);
        }
        else {
            throw Error("Not step match with definition type: " + stepDefinition.definitionType)
        }

    }
}

