import { RegisterStatusSummary } from "../../../src/interactors/registers/types"
import { LocalStepDefinition } from "../../../src/interactors/steps/definitions/localStep"
import { StepStatus, StepStatusTag } from "../../../src/interactors/steps/types"

export const case1Definition: LocalStepDefinition = {
    id: "case1testLocalStep",
    adapterDefinitionId: "case1Extractor",
    retartTries: 0,
    definitionType: "LocalStepDefinition",
    isFailedStatus: function (statusSummary: RegisterStatusSummary): boolean {
        return false
    }
}

const mockInitialStatus: StepStatus = {
    definitionId: "case1testLocalStep",
    definitionType: "LocalStepDefinition",
    id: "testStep",
    runOptions: null,
    statusSummary: {
        registerStatusSummary: {
            output_rows: 0,
            rows_success: 0,
            rows_failed: 0,
            rows_invalid: 0,
            rows_skipped: 0,
        },
        tryNumber: 0, //retries
        timeStarted: null,  //debugging
        timeFinished: null,   //debugging
        isFailedStep: false
    },
    syncContext: { stepId: "testStep", flowId: "testFlow" },
    statusTag: StepStatusTag.pending,
    statusMeta: null,
}

const mockFinalStatus: StepStatus = {
    definitionId: "case1testLocalStep",
    definitionType: "LocalStepDefinition",
    id: "testStep",
    statusTag: StepStatusTag.success,
    statusMeta: null,
    runOptions: null,
    statusSummary: {
        registerStatusSummary: {
            output_rows: 7,
            rows_success: 3,
            rows_failed: 2,
            rows_invalid: 1,
            rows_skipped: 1,
        },
        tryNumber: 1, //retries
        timeStarted: null,  //debugging
        timeFinished: null,   //debugging
        isFailedStep: false
    },
    syncContext: {
        flowId: "testFlow",
        stepId: "testStep",
    },
}

export const case1Mocks = { mockInitialStatus, mockFinalStatus }