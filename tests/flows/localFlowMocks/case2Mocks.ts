import { LocalFlowDefinition } from "../../../src/interactors/flows/processes/localFlow"
import { FlowStatus, FlowStatusTag } from "../../../src/interactors/flows/runners/types"

export const case2Definition: LocalFlowDefinition = {
    id: "case2testLocalFlow",
    definitionType: "LocalFlowDefinition",
    stepsDefinitionFlow: [{ id: "case1testLocalStep" }, { id: "case2testLocalStep", successMandatory: true }, { id: "case3testLocalStep" }]
}

const mockInitialStatus: FlowStatus = {
    definitionId: "case2testLocalFlow",
    definitionType: "LocalFlowDefinition",
    id: "testFlow",
    timeStarted: null,
    timeFinished: null,
    statusSummary: null,
    syncContext: { flowId: "testFlow" },
    statusTag: FlowStatusTag.pending,
    statusMeta: null,
}

const mockFinalStatus: FlowStatus = {
    definitionId: "case2testLocalFlow",
    definitionType: "LocalFlowDefinition",
    id: "testFlow",
    timeStarted: null,
    timeFinished: null,
    statusSummary: {
        stepsSuccess: 1,
        stepsTotal: 3,
        stepsFailed: 0,
        stepsInvalid: 1,
        stepsPending: 1
    },
    syncContext: { flowId: "testFlow" },
    statusTag: FlowStatusTag.failed,
    statusMeta: "Flow finished with pending steps",
}

export const case2Mocks = { mockInitialStatus, mockFinalStatus }