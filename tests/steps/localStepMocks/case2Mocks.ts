import { LocalStepDefinition, RegisterStats, StepStatus, StepStatusTag, AdapterRunOptions } from "../../../src"
import { case1Definition } from "../../adapters/localAdapterExtractorMocks/case1Mocks"

export const case2Definition: LocalStepDefinition = {
    id: "case2testLocalStep",
    adapterDefinitionId: "case1Extractor",
    maxRetries: 3,
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
    timeStarted: null,
    timeFinished: null,
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
    timeStarted: null,
    timeFinished: null,
    statusSummary: {
        registerStats: {
            registers_total: 8,
            registers_success: 3,
            registers_failed: 2,
            registers_invalid: 2,
            registers_skipped: 1,
        },
        retries: 3,
    }
}

const mockAdapterRunOptions: AdapterRunOptions = {}

const adapterDefinitions = [case1Definition];

export const case2Mocks = { mockInitialStatus, mockFinalStatus, mockAdapterRunOptions, adapterDefinitions }