
import { LocalAdapterSetTransformerDefinition, AdapterPresenter, RegisterStats, ReservedEntityTypes } from "../../../src";
import { ProcessStatus, ProcessType, StatusTag } from "../../../src/business/processStatus";
import { Register, RegisterStatusTag } from "../../../src/business/register";
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
        { success: false }
    ]
}
export const case7Definition: LocalAdapterSetTransformerDefinition<result2Class> = {
    id: "case7SetTransformer",
    inputTypes: ["resultClass"],
    outputType: "result2Class",
    definitionType: "LocalAdapterSetTransformerDefinition",
    async setsProcess(sets) {
        const entities = sets["resultClass"]
        throw Error("Test set case7 error, set length: " + entities.length)
    }
}
const mockNewRegisters: Register[] = [
    {
        id: "set-ebd1c577-a6aa-40b1-bdee-52f3ee0ea755",
        entityType: ReservedEntityTypes.setRegister,
        sourceAbsoluteId: "set-ebd1c577-a6aa-40b1-bdee-52f3ee0ea755",
        sourceRelativeId: "set-ebd1c577-a6aa-40b1-bdee-52f3ee0ea755",
        sourceEntityId: null,
        statusTag: RegisterStatusTag.success,
        statusMeta: null,
        entity: [],
        meta: null,
        date: new Date(),
        definitionId: case7Definition.id,
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            adapterId: "testAdapter",
        },
    },
    {
        id: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea644",
        entityType: "result2Class",
        sourceAbsoluteId: "fb7bc93a-17c1-467c-951d-58bf119c1967",
        sourceRelativeId: "fb7bc93a-17c1-467c-951d-58bf119c1967",
        sourceEntityId: null,
        statusTag: RegisterStatusTag.failed,
        statusMeta: "Test set case7 error, set length: 1",
        entity: null,
        meta: null,
        date: new Date(),
        definitionId: case7Definition.id,
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
const mockInitialStatus: ProcessStatus = {
    definitionId: "case7SetTransformer",
    id: "testAdapter",
    runOptions: null,
    syncContext: { adapterId: "testAdapter", stepId: "testStep", flowId: "testFlow" },
    statusTag: StatusTag.pending,
    statusMeta: null,
    timeStarted: null,
    timeFinished: null,
    processType: ProcessType.adapter
}
const mockFinalStatus: ProcessStatus = {
    ...mockInitialStatus,
    statusTag: StatusTag.success,
    timeStarted: new Date(),
    timeFinished: new Date(),
}
const mockInitialPresenter: AdapterPresenter = {
    definitionId: "case7SetTransformer",
    definitionType: "LocalAdapterSetTransformerDefinition",
    id: "testAdapter",
    outputType: "result2Class",
    runOptions: null,
    statusSummary: null,
    syncContext: { adapterId: "testAdapter", stepId: "testStep", flowId: "testFlow" },
    statusTag: StatusTag.pending,
    statusMeta: null,
    timeStarted: null,
    timeFinished: null
}
const mockFinalSummary: RegisterStats = {
    registers_total: 1,
    registers_failed: 1,
    registers_invalid: 0,
    registers_skipped: 0,
    registers_success: 0,
}
const mockFinalPresenter: AdapterPresenter = {
    ...mockInitialPresenter,
    statusSummary: mockFinalSummary,
    statusTag: StatusTag.success,
    timeStarted: null,
    timeFinished: null
}

export const case7Mocks = { mockInitialStatus, mockFinalStatus, mockInitialPresenter, mockFinalPresenter, mockFinalRegisters, mockInitialRegisters, inputEntities, mockNewRegisters }