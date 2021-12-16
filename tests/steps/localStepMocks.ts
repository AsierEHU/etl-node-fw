import { LocalStepDefinition } from "../../src/interactors/steps/definitions/localStep"
import { StepStatus, StepStatusSummary, StepStatusTag } from "../../src/interactors/steps/types"

export const localStepDefinition: LocalStepDefinition = {
    id: "testLocalStep",
    adapterDefinitionId: "case3Transformer",
    retartTries: 3,
    definitionType: "LocalStepDefinition",
    isFailedStatus: function (statusSummary: StepStatusSummary): boolean {
        return statusSummary.rows_failed > 0
    }
}

const mockInitialStatus: StepStatus = {
    definitionId: "testLocalStep",
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
    definitionId: "testLocalStep",
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
        output_rows: 0,
        rows_success: 0,
        rows_failed: 0,
        rows_invalid: 0,
        rows_skipped: 0,
    },
}

export const localStepMocks = { mockInitialStatus, mockFinalStatus }