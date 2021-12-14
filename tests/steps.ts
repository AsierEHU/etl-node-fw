
import { AdapterStatusSummary } from "../../src/interactors/adapters/types";
import { MyStepDefinition } from "../../src/interactors/steps/definitions/myFirstDefinition/types";

export const testStepExtractor: MyStepDefinition = {
    id: "test1",
    adapterDefinitionId: "testExtractor",
    retartTries: 3,
    definitionType: "MyStepDefinition",
    isFailedStatus: function (statusSummary: AdapterStatusSummary): boolean {
        return statusSummary.rows_failed > 0
    }
}

export const testStepTransformer: MyStepDefinition = {
    id: "test2",
    adapterDefinitionId: "testTransformer",
    retartTries: 1,
    definitionType: "MyStepDefinition",
    isFailedStatus: function (statusSummary: AdapterStatusSummary): boolean {
        return statusSummary.rows_failed > 0
    }
}

export const testStepLoader: MyStepDefinition = {
    id: "test3",
    adapterDefinitionId: "testLoader",
    retartTries: 2,
    definitionType: "MyStepDefinition",
    isFailedStatus: function (statusSummary: AdapterStatusSummary): boolean {
        return statusSummary.rows_failed > 0
    }
}

export const testStepFlex: MyStepDefinition = {
    id: "test4",
    adapterDefinitionId: "testFlex",
    retartTries: 1,
    definitionType: "MyStepDefinition",
    isFailedStatus: function (statusSummary: AdapterStatusSummary): boolean {
        return statusSummary.rows_failed > 0
    }
}
