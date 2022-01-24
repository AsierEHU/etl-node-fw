import { LocalStepDefinition, RegisterStats, StepPresenter, AdapterRunOptions } from "../../../src"
import { ProcessStatus, ProcessType, StatusTag } from "../../../src/business/processStatus"
import { case2Definition } from "../../adapters/localAdapterExtractorMocks/case2Mocks"

export const case4Definition: LocalStepDefinition = {
    id: "case4testLocalStep",
    adapterDefinitionId: "case2Extractor",
    maxRetries: 5,
    definitionType: "LocalStepDefinition",
    isInvalidRegistersSummary: function (statusSummary: RegisterStats): boolean {
        return false
    },
    adapterRunOptions: {
        onlyFailedEntities: false
    }
}

const mockInitialStatus: ProcessStatus = {
    definitionId: "case4testLocalStep",
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
    statusTag: StatusTag.failed,
    statusMeta: "Adapter failed",
    timeStarted: new Date(),
    timeFinished: new Date(),
}

const mockInitialPresenter: StepPresenter = {
    definitionId: "case4testLocalStep",
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
    definitionId: "case4testLocalStep",
    definitionType: "LocalStepDefinition",
    id: "testStep",
    statusTag: StatusTag.failed,
    statusMeta: "Adapter failed",
    syncContext: {
        flowId: "testFlow",
        stepId: "testStep",
    },
    timeStarted: null,
    timeFinished: null,
    statusSummary: {
        registerStats: {
            registers_total: 0,
            registers_success: 0,
            registers_failed: 0,
            registers_invalid: 0,
            registers_skipped: 0,
        },
        retries: 5,
    }
}

const mockAdapterRunOptions: AdapterRunOptions = {
    onlyFailedEntities: false
}

const adapterDefinitions = [case2Definition];

export const case4Mocks = { mockInitialStatus, mockFinalStatus, mockInitialPresenter, mockFinalPresenter, mockAdapterRunOptions, adapterDefinitions }