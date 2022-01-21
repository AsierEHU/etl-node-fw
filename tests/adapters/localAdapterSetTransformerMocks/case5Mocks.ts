import { LocalAdapterSetTransformerDefinition, AdapterPresenter, RegisterStats, ReservedEntityTypes } from "../../../src";
import { ProcessStatus, ProcessType, StatusTag } from "../../../src/business/processStatus";
import { Register, RegisterStatusTag } from "../../../src/business/register";

type resultClass = {
    success: boolean,
}
type result2Class = {
    successTotal: number
}
const mockInitialRegisters: Register[] = [
    {
        id: "fb7bc93a-17c1-467c-951d-58bf119c1967",
        entityType: "inputClass",
        sourceAbsoluteId: "fb7bc93a-17c1-467c-951d-58bf119c1967",
        sourceRelativeId: "fb7bc93a-17c1-467c-951d-58bf119c1967",
        sourceEntityId: "userDefinedId1",
        statusTag: RegisterStatusTag.success,
        statusMeta: null,
        entity: {
            field: "Raw Object text",
            y: 23,
        },
        meta: "rawMocked to success",
        date: new Date(),
        definitionId: "case1Extractor",
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            adapterId: "testAdapter",
        },
    },
    {
        id: "4e804c38-a540-4929-bc0d-0f9c51a1c203",
        entityType: "inputClass",
        sourceAbsoluteId: "4e804c38-a540-4929-bc0d-0f9c51a1c203",
        sourceRelativeId: "4e804c38-a540-4929-bc0d-0f9c51a1c203",
        sourceEntityId: null,
        statusTag: RegisterStatusTag.invalid,
        statusMeta: {
            type: "null object",
            action: "trigger alarm",
            severity: "high",
        },
        entity: null,
        meta: null,
        date: new Date(),
        definitionId: "case1Extractor",
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            adapterId: "testAdapter",
        },
    },
    {
        id: "4e804c38-a540-4929-bc0d-0f9c51a1c217",
        entityType: "inputClass",
        sourceAbsoluteId: "4e804c38-a540-4929-bc0d-0f9c51a1c217",
        sourceRelativeId: "4e804c38-a540-4929-bc0d-0f9c51a1c217",
        sourceEntityId: "userDefinedIdNull",
        statusTag: RegisterStatusTag.invalid,
        statusMeta: {
            type: "null object",
            action: "trigger alarm",
            severity: "high",
        },
        entity: null,
        meta: "null entity",
        date: new Date(),
        definitionId: "case1Extractor",
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            adapterId: "testAdapter",
        },
    },
    {
        id: "b056be4c-595e-419d-aa2f-c6607cca738b",
        entityType: "inputClass",
        sourceAbsoluteId: "b056be4c-595e-419d-aa2f-c6607cca738b",
        sourceRelativeId: "b056be4c-595e-419d-aa2f-c6607cca738b",
        sourceEntityId: null,
        statusTag: RegisterStatusTag.success,
        statusMeta: {
            fixMeta: {
                note: "Fixed changing to 1"
            },
            toFixEntity: {
                entity: {
                    field: "Raw Object text 2",
                    y: 1,
                },
                validationMeta: {
                    action: "trigger alarm",
                    severity: "low",
                    type: "0 error",
                }
            }
        },
        entity: {
            field: "Raw Object text 2",
            y: 1,
        },
        meta: null,
        date: new Date(),
        definitionId: "case1Extractor",
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            adapterId: "testAdapter",
        },
    },
    {
        id: "8d07acc6-1765-4862-8bb9-9ee1e9809e64",
        entityType: "inputClass",
        sourceAbsoluteId: "8d07acc6-1765-4862-8bb9-9ee1e9809e64",
        sourceRelativeId: "8d07acc6-1765-4862-8bb9-9ee1e9809e64",
        sourceEntityId: null,
        statusTag: RegisterStatusTag.skipped,
        statusMeta: null,
        entity: {
            field: "Raw Object text 3",
            y: -34,
        },
        meta: "rawMocked to skip",
        date: new Date(),
        definitionId: "case1Extractor",
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            adapterId: "testAdapter",
        },
    },
    {
        id: "b349def1-3c4e-4ddf-8378-2a3b3bd1c173",
        entityType: "inputClass",
        sourceAbsoluteId: "b349def1-3c4e-4ddf-8378-2a3b3bd1c173",
        sourceRelativeId: "b349def1-3c4e-4ddf-8378-2a3b3bd1c173",
        sourceEntityId: null,
        statusTag: RegisterStatusTag.success,
        statusMeta: null,
        entity: {
            field: "Raw Object text 3",
            y: 30,
        },
        meta: "rawMocked to fail",
        date: new Date(),
        definitionId: "case1Extractor",
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            adapterId: "testAdapter",
        },
    },
    {
        id: "df4hsdf-564e-4dgh-8458-2hgfff5633dss",
        entityType: "inputClass",
        sourceAbsoluteId: "df4hsdf-564e-4dgh-8458-2hgfff5633dss",
        sourceRelativeId: "df4hsdf-564e-4dgh-8458-2hgfff5633dss",
        sourceEntityId: null,
        statusTag: RegisterStatusTag.failed,
        statusMeta: "-1 exception",
        entity: {
            field: "Raw Object text 4",
            y: -1,
        },
        meta: null,
        date: new Date(),
        definitionId: "case1Extractor",
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            adapterId: "testAdapter",
        },
    },
    {
        id: "df4hsdf-564e-4dgh-8458-2hgfff5633ds4",
        entityType: "inputClass",
        sourceAbsoluteId: "df4hsdf-564e-4dgh-8458-2hgfff5633ds4",
        sourceRelativeId: "df4hsdf-564e-4dgh-8458-2hgfff5633ds4",
        sourceEntityId: null,
        statusTag: RegisterStatusTag.failed,
        statusMeta: "Exception Fixing",
        entity: {
            field: "Raw Object text 5",
            y: 1,
        },
        meta: null,
        date: new Date(),
        definitionId: "case1Extractor",
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            adapterId: "testAdapter",
        },
    },
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
        date: new Date(),
        definitionId: "case3Transformer",
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
        date: new Date(),
        definitionId: "case3Transformer",
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
        date: new Date(),
        definitionId: "case3Transformer",
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            adapterId: "testAdapter",
        },
    },
    {
        id: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea643",
        entityType: "resultClass",
        sourceAbsoluteId: "fb7bc93a-17c1-467c-951d-58bf119c1967",
        sourceRelativeId: "fb7bc93a-17c1-467c-951d-58bf119c1967",
        sourceEntityId: "userDefinedId1",
        statusTag: RegisterStatusTag.success,
        statusMeta: null,
        entity: {
            success: true,
        },
        meta: null,
        date: new Date(),
        definitionId: "case4Loader",
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            adapterId: "testAdapter",
        },
    },
    {
        id: "96a0a645-5bd7-46b3-aab5-0f30de460685",
        entityType: "resultClass",
        sourceAbsoluteId: "b056be4c-595e-419d-aa2f-c6607cca738b",
        sourceRelativeId: "b056be4c-595e-419d-aa2f-c6607cca738b",
        sourceEntityId: null,
        statusTag: RegisterStatusTag.invalid,
        statusMeta: null,
        entity: {
            success: false,
        },
        meta: null,
        date: new Date(),
        definitionId: "case4Loader",
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            adapterId: "testAdapter",
        },
    },
]
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
        id: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea751",
        entityType: ReservedEntityTypes.setRegister,
        sourceAbsoluteId: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea751",
        sourceRelativeId: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea751",
        sourceEntityId: null,
        statusTag: RegisterStatusTag.success,
        statusMeta: null,
        entity: ["ebd1c577-a6aa-40b1-bdee-52f3ee0ea643"],
        meta: null,
        date: new Date(),
        definitionId: case5Definition.id,
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            adapterId: "testAdapter",
        },
    },
    {
        id: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea644",
        entityType: "result2Class",
        sourceAbsoluteId: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea751",
        sourceRelativeId: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea751",
        sourceEntityId: null,
        statusTag: RegisterStatusTag.success,
        statusMeta: null,
        entity: {
            successTotal: 1,
        },
        meta: null,
        date: new Date(),
        definitionId: case5Definition.id,
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
    definitionId: "case5SetTransformer",
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
    definitionId: "case5SetTransformer",
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
    registers_failed: 0,
    registers_invalid: 0,
    registers_skipped: 0,
    registers_success: 1,
}
const mockFinalPresenter: AdapterPresenter = {
    ...mockInitialPresenter,
    statusSummary: mockFinalSummary,
    statusTag: StatusTag.success,
    timeStarted: null,
    timeFinished: null
}

export const case5Mocks = { mockInitialStatus, mockFinalStatus, mockInitialPresenter, mockFinalPresenter, mockFinalRegisters, mockInitialRegisters, inputEntities, mockNewRegisters }