import { LocalLinealFlowDefinition, FlowStatus, FlowStatusTag } from "../../../src"
import { StatusTag } from "../../../src/business/processStatus"

export const case1Definition: LocalLinealFlowDefinition = {
    id: "case1testLocalLinealFlow",
    definitionType: "LocalLinealFlowDefinition",
    stepsDefinitionFlow: [{ id: "case1testLocalStep" }, { id: "case3testLocalStep" }]
}

const mockInitialPresenter: FlowStatus = {
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

const mockFinalPresenter: FlowStatus = {
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

export const case1Mocks = { mockInitialPresenter, mockFinalPresenter }