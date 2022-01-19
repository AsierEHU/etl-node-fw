import { LocalStepDefinition, RegisterStats, StepPresenter, AdapterRunOptions } from "../../../src"
import { ProcessStatus, ProcessType, StatusTag } from "../../../src/business/processStatus"
import { case1Definition as case1AdapterDefinition } from "../../adapters/localAdapterExtractorMocks/case1Mocks"

export const case1Definition: LocalStepDefinition = {
    id: "case1testLocalStep",
    adapterDefinitionId: "case1Extractor",
    maxRetries: 0,
    definitionType: "LocalStepDefinition",
    isInvalidRegistersSummary: function (statusSummary: RegisterStats): boolean {
        return false
    },
    adapterRunOptions: null
}

const mockInitialStatus: ProcessStatus = {
    definitionId: "case1testLocalStep",
    id: "testStep",
    runOptions: undefined,
    syncContext: { stepId: "testStep", flowId: "testFlow" },
    statusTag: StatusTag.pending,
    statusMeta: null,
    timeStarted: null,
    timeFinished: null,
    processType: ProcessType.step
}

const mockFinalStatus: ProcessStatus = {
    ...mockInitialStatus,
    statusTag: StatusTag.success,
    timeStarted: new Date(),
    timeFinished: new Date(),
}

const mockInitialPresenter: StepPresenter = {
    definitionId: "case1testLocalStep",
    definitionType: "LocalStepDefinition",
    id: "testStep",
    statusSummary: null,
    syncContext: { stepId: "testStep", flowId: "testFlow" },
    statusTag: StatusTag.pending,
    statusMeta: null,
    timeStarted: null,
    timeFinished: null
}

const mockFinalPresenter: StepPresenter = {
    definitionId: "case1testLocalStep",
    definitionType: "LocalStepDefinition",
    id: "testStep",
    statusTag: StatusTag.success,
    statusMeta: null,
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
        retries: 0,
    },
    syncContext: {
        flowId: "testFlow",
        stepId: "testStep",
    },
}

const mockAdapterRunOptions: AdapterRunOptions = {}

const adapterDefinitions = [case1AdapterDefinition];

export const case1Mocks = { mockInitialStatus, mockFinalStatus, mockInitialPresenter, mockFinalPresenter, mockAdapterRunOptions, adapterDefinitions }