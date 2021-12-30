import { LocalFlowDefinition } from "../../../src/interactors/flows/processes/localFlow"
import { FlowStatus, FlowStatusTag } from "../../../src/interactors/flows/runners/types"

export const case1Definition: LocalFlowDefinition = {
    id: "case1testLocalFlow",
    definitionType: "LocalFlowDefinition",
    stepsDefinitionFlow: [{ id: "case1testLocalStep" }, { id: "case3testLocalStep" }]
}

const mockInitialStatus: FlowStatus = {
    definitionId: "case1testLocalFlow",
    definitionType: "LocalFlowDefinition",
    id: "testFlow",
    statusSummary: null,
    syncContext: { flowId: "testFlow" },
    statusTag: FlowStatusTag.pending,
    statusMeta: null,
    timeStarted: null,
    timeFinished: null
}

const mockFinalStatus: FlowStatus = {
    definitionId: "case1testLocalFlow",
    definitionType: "LocalFlowDefinition",
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