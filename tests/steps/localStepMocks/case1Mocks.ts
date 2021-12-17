import { LocalStepDefinition } from "../../../src/interactors/steps/definitions/localStep"
import { StepStatus, StepStatusSummary, StepStatusTag } from "../../../src/interactors/steps/types"

export const case1Definition: LocalStepDefinition = {
    id: "case1testLocalStep",
    adapterDefinitionId: "case1Extractor",
    retartTries: 0,
    definitionType: "LocalStepDefinition",
    isFailedStatus: function (statusSummary: StepStatusSummary): boolean {
        return false
    }
}

const mockInitialStatus: StepStatus = {
    definitionId: "case1testLocalStep",
    definitionType: "LocalStepDefinition",
    id: "testStep",
    runOptions: null,
    statusSummary: null,
    syncContext: { stepId: "testStep", flowId: "testFlow" },
    tryNumber: 0,
    statusTag: StepStatusTag.pending,
    statusMeta: null,
    timeStarted: null,
    timeFinished: null
}

const mockFinalStatus: StepStatus = {
    definitionId: "case1testLocalStep",
    definitionType: "LocalStepDefinition",
    id: "testStep",
    statusTag: StepStatusTag.success,
    tryNumber: 1,
    statusMeta: null,
    timeStarted: null,
    timeFinished: null,
    runOptions: null,
    syncContext: {
        flowId: "testFlow",
        stepId: "testStep",
    },
    statusSummary: {
        output_rows: 7,
        rows_success: 3,
        rows_failed: 2,
        rows_invalid: 1,
        rows_skipped: 1,
    },
}

export const case1Mocks = { mockInitialStatus, mockFinalStatus }