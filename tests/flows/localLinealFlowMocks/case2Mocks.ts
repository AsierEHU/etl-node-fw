import { LocalLinealFlowDefinition, FlowStatus, FlowStatusTag } from "../../../src"

export const case2Definition: LocalLinealFlowDefinition = {
    id: "case2testLocalLinealFlow",
    definitionType: "LocalLinealFlowDefinition",
    stepsDefinitionFlow: [{ id: "case1testLocalStep" }, { id: "case2testLocalStep", successMandatory: true }, { id: "case3testLocalStep" }]
}

const mockInitialStatus: FlowStatus = {
    definitionId: "case2testLocalLinealFlow",
    definitionType: "LocalLinealFlowDefinition",
    id: "testFlow",
    timeStarted: null,
    timeFinished: null,
    statusSummary: null,
    syncContext: { flowId: "testFlow" },
    statusTag: FlowStatusTag.pending,
    statusMeta: null,
}

const mockFinalStatus: FlowStatus = {
    definitionId: "case2testLocalLinealFlow",
    definitionType: "LocalLinealFlowDefinition",
    id: "testFlow",
    timeStarted: null,
    timeFinished: null,
    statusSummary: {
        stepsSuccess: 1,
        stepsTotal: 3,
        stepsFailed: 0,
        stepsInvalid: 0,
        stepsPending: 2
    },
    syncContext: { flowId: "testFlow" },
    statusTag: FlowStatusTag.failed,
    statusMeta: "Flow finished with pending steps",
}

export const case2Mocks = { mockInitialStatus, mockFinalStatus }