import { LocalStepDefinition, RegisterStats, StepStatus, AdapterRunOptions } from "../../../src"
import { StatusTag } from "../../../src/business/processStatus"
import { case1Definition } from "../../adapters/localAdapterExtractorMocks/case1Mocks"

export const case3Definition: LocalStepDefinition = {
    id: "case3testLocalStep",
    adapterDefinitionId: "case1Extractor",
    maxRetries: 1,
    definitionType: "LocalStepDefinition",
    isInvalidRegistersSummary: function (statusSummary: RegisterStats): boolean {
        return false
    },
    adapterRunOptions: {
        onlyFailedEntities: false
    }
}

const mockInitialPresenter: StepStatus = {
    definitionId: "case3testLocalStep",
    definitionType: "LocalStepDefinition",
    id: "testStep",
    statusSummary: null,
    syncContext: { stepId: "testStep", flowId: "testFlow" },
    statusTag: StatusTag.pending,
    statusMeta: null,
    timeStarted: null,
    timeFinished: null
}

const mockFinalPresenter: StepStatus = {
    definitionId: "case3testLocalStep",
    definitionType: "LocalStepDefinition",
    id: "testStep",
    statusTag: StatusTag.success,
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
        retries: 1,
    }
}

const mockAdapterRunOptions: AdapterRunOptions = {
    onlyFailedEntities: false
}

const adapterDefinitions = [case1Definition];

export const case3Mocks = { mockInitialPresenter, mockFinalPresenter, mockAdapterRunOptions, adapterDefinitions }