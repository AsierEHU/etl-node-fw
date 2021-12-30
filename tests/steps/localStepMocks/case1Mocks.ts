import { AdapterRunOptions } from "../../../src/interactors/adapters/processes/types"
import { RegisterStats } from "../../../src/interactors/registers/types"
import { LocalStepDefinition } from "../../../src/interactors/steps/processes/localStep"
import { StepStatus, StepStatusTag } from "../../../src/interactors/steps/runners/types"

export const case1Definition: LocalStepDefinition = {
    id: "case1testLocalStep",
    adapterDefinitionId: "case1Extractor",
    retartTries: 0,
    definitionType: "LocalStepDefinition",
    isFailedStatus: function (statusSummary: RegisterStats): boolean {
        return false
    },
    adapterDefinitionRunOptions: null
}

const mockInitialStatus: StepStatus = {
    definitionId: "case1testLocalStep",
    definitionType: "LocalStepDefinition",
    id: "testStep",
    statusSummary: null,
    syncContext: { stepId: "testStep", flowId: "testFlow" },
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
    statusMeta: null,
    timeStarted: null,  //debugging
    timeFinished: null,   //debugging
    statusSummary: {
        registerStats: {
            output_rows: 7,
            rows_success: 3,
            rows_failed: 2,
            rows_invalid: 1,
            rows_skipped: 1,
        },
        tryNumber: 1, //retries
        failedByDefinition: false
    },
    syncContext: {
        flowId: "testFlow",
        stepId: "testStep",
    },
}

const mockAdapterRunOptions: AdapterRunOptions = {
    syncContext: {
        flowId: "testFlow",
        stepId: "testStep",
        adapterId: "testAdapter",
    }
}

export const case1Mocks = { mockInitialStatus, mockFinalStatus, mockAdapterRunOptions }