import { LocalLinealFlowDefinition, FlowPresenter, FlowStatusTag } from "../../../src"
import { ProcessStatus, ProcessType, StatusTag } from "../../../src/business/processStatus"

export const case1Definition: LocalLinealFlowDefinition = {
    id: "case1testLocalLinealFlow",
    definitionType: "LocalLinealFlowDefinition",
    stepsDefinitionFlow: [{ id: "case1testLocalStep" }, { id: "case3testLocalStep" }]
}

const mockInitialStatus: ProcessStatus = {
    definitionId: "case1testLocalLinealFlow",
    id: "testFlow",
    runOptions: null,
    syncContext: { flowId: "testFlow" },
    statusTag: StatusTag.pending,
    statusMeta: null,
    timeStarted: null,
    timeFinished: null,
    processType: ProcessType.flow
}

const mockFinalStatus: ProcessStatus = {
    ...mockInitialStatus,
    statusTag: StatusTag.success,
    timeStarted: new Date(),
    timeFinished: new Date(),
}

const mockInitialPresenter: FlowPresenter = {
    definitionId: "case1testLocalLinealFlow",
    definitionType: "LocalLinealFlowDefinition",
    id: "testFlow",
    statusSummary: null,
    syncContext: { flowId: "testFlow" },
    statusTag: StatusTag.pending,
    statusMeta: null,
    timeStarted: null,
    timeFinished: null
}

const mockFinalPresenter: FlowPresenter = {
    definitionId: "case1testLocalLinealFlow",
    definitionType: "LocalLinealFlowDefinition",
    id: "testFlow",
    timeStarted: null,
    timeFinished: null,
    statusSummary: {
        stepsSuccess: 2,
        stepsFailed: 0,
        stepsInvalid: 0,
    },
    syncContext: { flowId: "testFlow" },
    statusTag: StatusTag.success,
    statusMeta: null,
}

export const case1Mocks = { mockInitialStatus, mockFinalStatus, mockInitialPresenter, mockFinalPresenter }