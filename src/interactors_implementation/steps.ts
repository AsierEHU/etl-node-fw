
import { MyStepDefinition } from "../interactors/steps/definitions/my_first_definition";
import { testExtractor, testLoader, testTransformer } from "./adapters";

export const testStepExtractor: MyStepDefinition = {
    id: "test1",
    adapterDefinition: testExtractor,
    retartTries: 3,
    definitionType: "MyStepDefinition",
}

export const testStepTransformer: MyStepDefinition = {
    id: "test2",
    adapterDefinition: testTransformer,
    retartTries: 1,
    definitionType: "MyStepDefinition",
}

export const testStepLoader: MyStepDefinition = {
    id: "test3",
    adapterDefinition: testLoader,
    retartTries: 2,
    definitionType: "MyStepDefinition",
}
