import { AdapterRunOptions } from "../../../src/interactors/adapters/types"
import { LocalFlowDefinition } from "../../../src/interactors/flows/definitions/localFlow"
import { FlowStatus, FlowStatusTag } from "../../../src/interactors/flows/types"

export const case1Definition: LocalFlowDefinition = {
    id: "case1testLocalFlow",
    definitionType: "LocalFlowDefinition",
    stepsDefinitionFlow: [{ id: "case1testLocalStep" }, { id: "case3testLocalStep" }]
}

const mockInitialStatus: FlowStatus = {
    definitionId: "case1testLocalFlow",
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
    definitionId: "case1testLocalFlow",
    definitionType: "LocalFlowDefinition",
    id: "testFlow",
    statusSummary: {
        timeStarted: null,
        timeFinished: null,
        stepFailedId: null,
        stepsSuccess: 2,
        stepsTotal: 2
    },
    syncContext: { flowId: "testFlow" },
    statusTag: FlowStatusTag.success,
    statusMeta: null,
}

export const case1Mocks = { mockInitialStatus, mockFinalStatus }