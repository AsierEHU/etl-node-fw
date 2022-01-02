import { AdapterRunOptions } from "../../../src/interactors/adapters/processes/types"
import { RegisterStats } from "../../../src/interactors/registers/types"
import { LocalStepDefinition } from "../../../src/interactors/steps/processes/localStep"
import { StepStatus, StepStatusTag } from "../../../src/interactors/steps/runners/types"

export const case3Definition: LocalStepDefinition = {
    id: "case3testLocalStep",
    adapterDefinitionId: "case1Extractor",
    retartTries: 1,
    definitionType: "LocalStepDefinition",
    isInvalidRegistersSummary: function (statusSummary: RegisterStats): boolean {
        return false
    },
    adapterRunOptions: {
        onlyFailedEntities: false
    }
}

const mockInitialStatus: StepStatus = {
    definitionId: "case3testLocalStep",
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
    definitionId: "case3testLocalStep",
    definitionType: "LocalStepDefinition",
    id: "testStep",
    statusTag: StepStatusTag.success,
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
        tryNumber: 2, //retries
        isInvalidRegistersSummary: false
    }
}

const mockAdapterRunOptions: AdapterRunOptions = {
    onlyFailedEntities: false
}

export const case3Mocks = { mockInitialStatus, mockFinalStatus, mockAdapterRunOptions }