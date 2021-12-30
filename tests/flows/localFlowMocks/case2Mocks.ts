import { LocalFlowDefinition } from "../../../src/interactors/flows/processes/localFlow"
import { FlowStatus, FlowStatusTag } from "../../../src/interactors/flows/runners/types"

export const case2Definition: LocalFlowDefinition = {
    id: "case2testLocalFlow",
    definitionType: "LocalFlowDefinition",
    stepsDefinitionFlow: [{ id: "case1testLocalStep" }, { id: "case2testLocalStep" }, { id: "case3testLocalStep" }]
}

const mockInitialStatus: FlowStatus = {
    definitionId: "case2testLocalFlow",
    definitionType: "LocalFlowDefinition",
    id: "testFlow",
    statusSummary: {
        timeStarted: null,
        timeFinished: null,
        stepFailedId: null,
        stepsSuccess: 0,
        stepsTotal: 0
    },
    syncContext: { flowId: "testFlow" },
    statusTag: FlowStatusTag.pending,
    statusMeta: null,
}

const mockFinalStatus: FlowStatus = {
    definitionId: "case2testLocalFlow",
    definitionType: "LocalFlowDefinition",
    id: "testFlow",
    statusSummary: {
        timeStarted: null,
        timeFinished: null,
        stepFailedId: "case2testLocalStep",
        stepsSuccess: 1,
        stepsTotal: 3
    },
    syncContext: { flowId: "testFlow" },
    statusTag: FlowStatusTag.failed,
    statusMeta: null,
}

export const case2Mocks = { mockInitialStatus, mockFinalStatus }