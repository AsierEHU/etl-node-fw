import { LocalLinealFlowDefinition, FlowStatus, FlowStatusTag } from "../../../src"
import { StatusTag } from "../../../src/business/processStatus"

export const case2Definition: LocalLinealFlowDefinition = {
    id: "case2testLocalLinealFlow",
    definitionType: "LocalLinealFlowDefinition",
    stepsDefinitionFlow: [{ id: "case1testLocalStep" }, { id: "case2testLocalStep", successMandatory: true }, { id: "case3testLocalStep" }]
}

const mockInitialPresenter: FlowStatus = {
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

const mockFinalPresenter: FlowStatus = {
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

export const case2Mocks = { mockInitialPresenter, mockFinalPresenter }