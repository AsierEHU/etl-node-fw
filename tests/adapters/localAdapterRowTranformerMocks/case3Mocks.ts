import { Register, LocalAdapterTransformerRowDefinition, RegisterStatusTag, AdapterStatus, AdapterStatusTag, RegisterStats } from "../../../src";
import { case1Mocks } from "../localAdapterExtractorMocks/case1Mocks";

type inputClass = {
    field: string,
    y: number,
}
type outputClass = {
    text: string,
    others: {
        x: number,
    }
}
const mockInitialRegisters: Register[] = case1Mocks.mockFinalRegisters
const inputEntities = {
    ["inputClass"]: [
        {
            $entity: {
                field: "Raw Object text",
                y: 23,
            },
            $meta: "rawMocked to success",
            $id: "userDefinedId1"
        },
        {
            field: "Raw Object text 2",
            y: 1,
        },
        {
            field: "Raw Object text 3",
            y: 30,
        },
    ]
}
export const case3Definition: LocalAdapterTransformerRowDefinition<inputClass, outputClass> = {
    id: "case3Transformer",
    definitionType: "LocalAdapterTransformerRowDefinition",
    inputType: "inputClass",
    outputType: "outputClass",
    async entityProcess(entity: inputClass) {
        if (entity.y == 30) {
            throw new Error("Y 30 error!!")
        }
        return {
            text: entity.field,
            others: {
                x: entity.y,
            }
        };
    },
}
const mockNewRegisters: Register[] = [
    {
        id: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea642",
        entityType: "outputClass",
        sourceAbsoluteId: "fb7bc93a-17c1-467c-951d-58bf119c1967",
        sourceRelativeId: "fb7bc93a-17c1-467c-951d-58bf119c1967",
        sourceEntityId: "userDefinedId1",
        statusTag: RegisterStatusTag.success,
        statusMeta: null,
        entity: {
            text: "Raw Object text",
            others: {
                x: 23,
            },
        },
        meta: null,
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            adapterId: "testAdapter",
        },
    },
    {
        id: "96a0a645-5bd7-46b3-aab5-0f30de460684",
        entityType: "outputClass",
        sourceAbsoluteId: "b056be4c-595e-419d-aa2f-c6607cca738b",
        sourceRelativeId: "b056be4c-595e-419d-aa2f-c6607cca738b",
        sourceEntityId: null,
        statusTag: RegisterStatusTag.success,
        statusMeta: null,
        entity: {
            text: "Raw Object text 2",
            others: {
                x: 1,
            },
        },
        meta: null,
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            adapterId: "testAdapter",
        },
    },
    {
        id: "b0cb6bb8-38c1-4fce-bb2b-75fb244c5b30",
        entityType: "outputClass",
        sourceAbsoluteId: "b349def1-3c4e-4ddf-8378-2a3b3bd1c173",
        sourceRelativeId: "b349def1-3c4e-4ddf-8378-2a3b3bd1c173",
        sourceEntityId: null,
        statusTag: RegisterStatusTag.failed,
        statusMeta: "Y 30 error!!",
        entity: null,
        meta: null,
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            adapterId: "testAdapter",
        },
    },
]
const mockFinalRegisters: Register[] = [
    ...mockInitialRegisters,
    ...mockNewRegisters
]
const mockInitialStatus: AdapterStatus = {
    definitionId: "case3Transformer",
    definitionType: "LocalAdapterTransformerRowDefinition",
    id: "testAdapter",
    outputType: "outputClass",
    runOptions: null,
    statusSummary: null,
    syncContext: { adapterId: "testAdapter", stepId: "testStep", flowId: "testFlow" },
    statusTag: AdapterStatusTag.pending,
    statusMeta: null,
    timeStarted: null,
    timeFinished: null
}
const mockFinalSummary: RegisterStats = {
    registers_total: 3,
    registers_failed: 1,
    registers_invalid: 0,
    registers_skipped: 0,
    registers_success: 2,
}
const mockFinalStatus: AdapterStatus = {
    ...mockInitialStatus,
    statusSummary: mockFinalSummary,
    statusTag: AdapterStatusTag.success,
    timeStarted: null,
    timeFinished: null
}

export const case3Mocks = { mockInitialStatus, mockFinalStatus, mockFinalRegisters, mockInitialRegisters, inputEntities, mockNewRegisters }