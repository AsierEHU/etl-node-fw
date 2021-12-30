import { AdapterRunOptions } from "../../../src/interactors/adapters/processes/types"
import { RegisterStatusSummary } from "../../../src/interactors/registers/types"
import { LocalStepDefinition } from "../../../src/interactors/steps/processes/localStep"
import { StepStatus, StepStatusTag } from "../../../src/interactors/steps/runners/types"
import { case1Mocks } from "../../adapters/localAdapterExtractorMocks/case1Mocks"

export const case3Definition: LocalStepDefinition = {
    id: "case3testLocalStep",
    adapterDefinitionId: "case1Extractor",
    retartTries: 1,
    definitionType: "LocalStepDefinition",
    isFailedStatus: function (statusSummary: RegisterStatusSummary): boolean {
        return false
    },
    adapterDefinitionRunOptions: {
        mockEntities: case1Mocks.inputEntities,
        onlyFailedEntities: false
    }
}

const mockInitialStatus: StepStatus = {
    definitionId: "case3testLocalStep",
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
        failedByDefinition: false
    },
    syncContext: { stepId: "testStep", flowId: "testFlow" },
    statusTag: StepStatusTag.pending,
    statusMeta: null,
}

const mockFinalStatus: StepStatus = {
    definitionId: "case3testLocalStep",
    definitionType: "LocalStepDefinition",
    id: "testStep",
    statusTag: StepStatusTag.success,
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
        tryNumber: 2, //retries
        timeStarted: null,  //debugging
        timeFinished: null,   //debugging
        failedByDefinition: false
    }
}

const mockAdapterRunOptions: AdapterRunOptions = {
    syncContext: {
        flowId: "testFlow",
        stepId: "testStep",
        adapterId: "testAdapter",
    },
    useMockedEntities: true,
    onlyFailedEntities: false
}

export const case3Mocks = { mockInitialStatus, mockFinalStatus, mockAdapterRunOptions }