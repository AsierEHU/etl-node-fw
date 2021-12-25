import { RegisterStatusSummary } from "../../../src/interactors/registers/types"
import { LocalStepDefinition } from "../../../src/interactors/steps/definitions/localStep"
import { StepStatus, StepStatusTag } from "../../../src/interactors/steps/types"

export const case2Definition: LocalStepDefinition = {
    id: "case2testLocalStep",
    adapterDefinitionId: "case1Extractor",
    retartTries: 3,
    definitionType: "LocalStepDefinition",
    isFailedStatus: function (statusSummary: RegisterStatusSummary): boolean {
        return true
    },
    adapterDefinitionRunOptions: null
}

const mockInitialStatus: StepStatus = {
    definitionId: "case2testLocalStep",
    definitionType: "LocalStepDefinition",
    id: "testStep",
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
        failedStatusSummary: false
    },
    syncContext: { stepId: "testStep", flowId: "testFlow" },
    statusTag: StepStatusTag.pending,
    statusMeta: null,
}

const mockFinalStatus: StepStatus = {
    definitionId: "case2testLocalStep",
    definitionType: "LocalStepDefinition",
    id: "testStep",
    statusTag: StepStatusTag.failed,
    statusMeta: null,
    syncContext: {
        flowId: "testFlow",
        stepId: "testStep",
    },
    statusSummary: {
        registerStatusSummary: {
            output_rows: 7,
            rows_success: 3,
            rows_failed: 2,
            rows_invalid: 1,
            rows_skipped: 1,
        },
        tryNumber: 4, //retries
        timeStarted: null,  //debugging
        timeFinished: null,   //debugging
        failedStatusSummary: true
    }
}

export const case2Mocks = { mockInitialStatus, mockFinalStatus }