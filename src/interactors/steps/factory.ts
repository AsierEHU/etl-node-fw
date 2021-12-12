import { MyStep, MyStepDefinition, MyStepDependencies } from "./definitions/my_first_definition";
import { Step, StepDefinition } from "./types"

export class StepFactory {
    private readonly stepDefinitionsMap: { [key: string]: StepDefinition }

    constructor(stepDefinitions: Array<StepDefinition>) {
        this.stepDefinitionsMap = stepDefinitions.reduce((map, stepDefinition) => ({ ...map, [stepDefinition.id]: stepDefinition }), {})
    }

    public createStep(definitionId: string, dependencies: any): Step<StepDefinition> {
        const stepDefinition = this.stepDefinitionsMap[definitionId];
        const stepDependencies = dependencies;
        stepDependencies.stepDefinition = stepDefinition;

        if (stepDefinition.definitionType == "MyStepDefinition") {
            return new MyStep(stepDependencies);
        }
        else {
            throw Error("Not step match with definition id: " + definitionId)
        }

    }
}

