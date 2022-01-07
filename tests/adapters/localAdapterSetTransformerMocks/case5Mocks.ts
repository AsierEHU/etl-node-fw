import { Register, LocalAdapterSetTransformerDefinition, RegisterStatusTag, AdapterStatus, AdapterStatusTag, RegisterStats } from "../../../src";
import { case4Mocks } from "../localAdapterLoaderMocks/case4Mocks";

type resultClass = {
    success: boolean,
}
type result2Class = {
    successTotal: number
}
const mockInitialRegisters: Register[] = case4Mocks.mockFinalRegisters
const inputEntities = {
    ["resultClass"]: [
        { success: true }
    ]
}
export const case5Definition: LocalAdapterSetTransformerDefinition<result2Class> = {
    id: "case5SetTransformer",
    inputTypes: ["resultClass"],
    outputType: "result2Class",
    definitionType: "LocalAdapterSetTransformerDefinition",
    async setsProcess(sets) {
        const entities = sets["resultClass"]
        return [{
            successTotal: entities.length
        }];
    }
}
const mockNewRegisters: Register[] = [
    {
        id: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea644",
        entityType: "result2Class",
        sourceAbsoluteId: "fb7bc93a-17c1-467c-951d-58bf119c1967",
        sourceRelativeId: "fb7bc93a-17c1-467c-951d-58bf119c1967",
        sourceEntityId: null,
        statusTag: RegisterStatusTag.success,
        statusMeta: null,
        entity: {
            successTotal: 1,
        },
        meta: null,
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            adapterId: "testAdapter",
        },
    }
]
const mockFinalRegisters: Register[] = [
    ...mockInitialRegisters,
    ...mockNewRegisters
]
const mockInitialStatus: AdapterStatus = {
    definitionId: "case5SetTransformer",
    definitionType: "LocalAdapterSetTransformerDefinition",
    id: "testAdapter",
    outputType: "result2Class",
    runOptions: null,
    statusSummary: null,
    syncContext: { adapterId: "testAdapter", stepId: "testStep", flowId: "testFlow" },
    statusTag: AdapterStatusTag.pending,
    statusMeta: null,
    timeStarted: null,
    timeFinished: null
}
const mockFinalSummary: RegisterStats = {
    registers_total: 1,
    registers_failed: 0,
    registers_invalid: 0,
    registers_skipped: 0,
    registers_success: 1,
}
const mockFinalStatus: AdapterStatus = {
    ...mockInitialStatus,
    statusSummary: mockFinalSummary,
    statusTag: AdapterStatusTag.success,
    timeStarted: null,
    timeFinished: null
}

export const case5Mocks = { mockInitialStatus, mockFinalStatus, mockFinalRegisters, mockInitialRegisters, inputEntities, mockNewRegisters }