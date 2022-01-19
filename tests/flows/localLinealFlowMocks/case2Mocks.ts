import { LocalLinealFlowDefinition, FlowPresenter, FlowStatusTag } from "../../../src"
import { ProcessStatus, ProcessType, StatusTag } from "../../../src/business/processStatus"

export const case2Definition: LocalLinealFlowDefinition = {
    id: "case2testLocalLinealFlow",
    definitionType: "LocalLinealFlowDefinition",
    stepsDefinitionFlow: [{ id: "case1testLocalStep" }, { id: "case2testLocalStep", successMandatory: true }, { id: "case3testLocalStep" }]
}

const mockInitialStatus: ProcessStatus = {
    definitionId: "case2testLocalLinealFlow",
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
    statusTag: StatusTag.failed,
    statusMeta: "Step case2testLocalStep is mandatory success, but finished with status invalid",
    timeStarted: new Date(),
    timeFinished: new Date(),
}

const mockInitialPresenter: FlowPresenter = {
    definitionId: "case2testLocalLinealFlow",
    definitionType: "LocalLinealFlowDefinition",
    id: "testFlow",
    timeStarted: null,
    timeFinished: null,
    statusSummary: null,
    syncContext: { flowId: "testFlow" },
    statusTag: StatusTag.pending,
    statusMeta: null,
}

const mockFinalPresenter: FlowPresenter = {
    definitionId: "case2testLocalLinealFlow",
    definitionType: "LocalLinealFlowDefinition",
    id: "testFlow",
    timeStarted: null,
    timeFinished: null,
    statusSummary: {
        stepsSuccess: 1,
        stepsFailed: 0,
        stepsInvalid: 1,
    },
    syncContext: { flowId: "testFlow" },
    statusTag: StatusTag.failed,
    statusMeta: "Step case2testLocalStep is mandatory success, but finished with status invalid",
}

export const case2Mocks = { mockInitialStatus, mockFinalStatus, mockInitialPresenter, mockFinalPresenter }