import { AdapterRunOptions } from "../../../src/interactors/adapters/processes/types"
import { RegisterStats } from "../../../src/interactors/registers/types"
import { LocalStepDefinition } from "../../../src/interactors/steps/processes/localStep"
import { StepStatus, StepStatusTag } from "../../../src/interactors/steps/runners/types"

export const case2Definition: LocalStepDefinition = {
    id: "case2testLocalStep",
    adapterDefinitionId: "case1Extractor",
    retartTries: 3,
    definitionType: "LocalStepDefinition",
    isInvalidRegistersSummary: function (statusSummary: RegisterStats): boolean {
        return true
    },
    adapterRunOptions: null
}

const mockInitialStatus: StepStatus = {
    definitionId: "case2testLocalStep",
    definitionType: "LocalStepDefinition",
    id: "testStep",
    timeStarted: null,  //debugging
    timeFinished: null,   //debugging
    statusSummary: null,
    syncContext: { stepId: "testStep", flowId: "testFlow" },
    statusTag: StepStatusTag.pending,
    statusMeta: null,
}

const mockFinalStatus: StepStatus = {
    definitionId: "case2testLocalStep",
    definitionType: "LocalStepDefinition",
    id: "testStep",
    statusTag: StepStatusTag.invalid,
    statusMeta: null,
    syncContext: {
        flowId: "testFlow",
        stepId: "testStep",
    },
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
        tryNumber: 4, //retries
        isInvalidRegistersSummary: true
    }
}

const mockAdapterRunOptions: AdapterRunOptions = {}

export const case2Mocks = { mockInitialStatus, mockFinalStatus, mockAdapterRunOptions }