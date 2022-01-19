import { LocalStepDefinition, RegisterStats, StepPresenter, AdapterRunOptions } from "../../../src"
import { ProcessStatus, ProcessType, StatusTag } from "../../../src/business/processStatus"
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


const mockInitialStatus: ProcessStatus = {
    definitionId: "case2testLocalStep",
    id: "testStep",
    runOptions: null,
    syncContext: { stepId: "testStep", flowId: "testFlow" },
    statusTag: StatusTag.pending,
    statusMeta: null,
    timeStarted: null,
    timeFinished: null,
    processType: ProcessType.step
}

const mockFinalStatus: ProcessStatus = {
    ...mockInitialStatus,
    statusTag: StatusTag.invalid,
    timeStarted: new Date(),
    timeFinished: new Date(),
}

const mockInitialPresenter: StepPresenter = {
    definitionId: "case2testLocalStep",
    definitionType: "LocalStepDefinition",
    id: "testStep",
    timeStarted: null,
    timeFinished: null,
    statusSummary: null,
    syncContext: { stepId: "testStep", flowId: "testFlow" },
    statusTag: StatusTag.pending,
    statusMeta: null,
}

const mockFinalPresenter: StepPresenter = {
    definitionId: "case2testLocalStep",
    definitionType: "LocalStepDefinition",
    id: "testStep",
    statusTag: StatusTag.invalid,
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

export const case2Mocks = { mockInitialStatus, mockFinalStatus, mockInitialPresenter, mockFinalPresenter, mockAdapterRunOptions, adapterDefinitions }