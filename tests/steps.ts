
import { AdapterStatusSummary } from "../../src/interactors/adapters/types";
import { LocalStepDefinition } from "../../src/interactors/steps/definitions/myFirstDefinition/types";

export const testStepExtractor: LocalStepDefinition = {
    id: "test1",
    adapterDefinitionId: "testExtractor",
    retartTries: 3,
    definitionType: "LocalStepDefinition",
    isFailedStatus: function (statusSummary: AdapterStatusSummary): boolean {
        return statusSummary.rows_failed > 0
    }
}

export const testStepTransformer: LocalStepDefinition = {
    id: "test2",
    adapterDefinitionId: "testTransformer",
    retartTries: 1,
    definitionType: "LocalStepDefinition",
    isFailedStatus: function (statusSummary: AdapterStatusSummary): boolean {
        return statusSummary.rows_failed > 0
    }
}

export const testStepLoader: LocalStepDefinition = {
    id: "test3",
    adapterDefinitionId: "testLoader",
    retartTries: 2,
    definitionType: "LocalStepDefinition",
    isFailedStatus: function (statusSummary: AdapterStatusSummary): boolean {
        return statusSummary.rows_failed > 0
    }
}

export const testStepFlex: LocalStepDefinition = {
    id: "test4",
    adapterDefinitionId: "testFlex",
    retartTries: 1,
    definitionType: "LocalStepDefinition",
    isFailedStatus: function (statusSummary: AdapterStatusSummary): boolean {
        return statusSummary.rows_failed > 0
    }
}
