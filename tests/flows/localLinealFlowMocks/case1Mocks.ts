import { LocalLinealFlowDefinition, FlowStatus, FlowStatusTag } from "../../../src"

export const case1Definition: LocalLinealFlowDefinition = {
    id: "case1testLocalLinealFlow",
    definitionType: "LocalLinealFlowDefinition",
    stepsDefinitionFlow: [{ id: "case1testLocalStep" }, { id: "case3testLocalStep" }]
}

const mockInitialStatus: FlowStatus = {
    definitionId: "case1testLocalLinealFlow",
    definitionType: "LocalLinealFlowDefinition",
    id: "testFlow",
    statusSummary: null,
    syncContext: { flowId: "testFlow" },
    statusTag: FlowStatusTag.pending,
    statusMeta: null,
    timeStarted: null,
    timeFinished: null
}

const mockFinalStatus: FlowStatus = {
    definitionId: "case1testLocalLinealFlow",
    definitionType: "LocalLinealFlowDefinition",
    id: "testFlow",
    timeStarted: null,
    timeFinished: null,
    statusSummary: {
        stepsSuccess: 2,
        stepsTotal: 2,
        stepsFailed: 0,
        stepsInvalid: 0,
        stepsPending: 0
    },
    syncContext: { flowId: "testFlow" },
    statusTag: FlowStatusTag.success,
    statusMeta: null,
}

export const case1Mocks = { mockInitialStatus, mockFinalStatus }