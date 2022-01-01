import { AdapterRunOptions } from "../../../src/interactors/adapters/processes/types"
import { RegisterStats } from "../../../src/interactors/registers/types"
import { LocalStepDefinition } from "../../../src/interactors/steps/processes/localStep"
import { StepStatus, StepStatusTag } from "../../../src/interactors/steps/runners/types"

export const case1Definition: LocalStepDefinition = {
    id: "case1testLocalStep",
    adapterDefinitionId: "case1Extractor",
    retartTries: 0,
    definitionType: "LocalStepDefinition",
    isInvalidRegistersSummary: function (statusSummary: RegisterStats): boolean {
        return false
    },
    adapterRunOptions: null
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
            registers_total: 7,
            registers_success: 3,
            registers_failed: 2,
            registers_invalid: 1,
            registers_skipped: 1,
        },
        tryNumber: 1, //retries
        isInvalidRegistersSummary: false
    },
    syncContext: {
        flowId: "testFlow",
        stepId: "testStep",
    },
}

const mockAdapterRunOptions: AdapterRunOptions = {}

export const case1Mocks = { mockInitialStatus, mockFinalStatus, mockAdapterRunOptions }