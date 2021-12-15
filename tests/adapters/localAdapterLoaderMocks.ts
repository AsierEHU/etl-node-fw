import { LocalAdapterLoaderDefinition } from "../../src/interactors/adapters/definitions/localAdapterLoader";
import { InputEntity } from "../../src/interactors/adapters/types";
import { Entity, Register, RegisterStatusTag } from "../../src/interactors/registers/types";
import { localAdapterTransformerMocks } from "./localAdapterTransformerMocks";

type outputClass = {
    text: string,
    others: {
        x: number,
    }
}

type resultClass = {
    success: boolean,
}

const mockInitialRegisters: Register<Entity>[] = localAdapterTransformerMocks.mockFinalRegisters
const mockEntities: InputEntity[] = [
    {
        text: "Raw Object text",
        others: {
            x: 23,
        },
    },
    {
        text: "Raw Object text 2",
        others: {
            x: 1,
        },
    }
];
export const localAdapterLoaderDefinition: LocalAdapterLoaderDefinition<outputClass, resultClass> = {
    id: "testLoader",
    definitionType: "LocalAdapterLoaderDefinition",
    inputType: "outputClass",
    outputType: "resultClass",
    async entityLoad(entity: outputClass) {
        return {
            success: true,
        } as resultClass;
    },
}
const mockFinalRegisters: Register<Entity>[] = [
    ...mockInitialRegisters,
    {
        id: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea642",
        entityType: "resultClass",
        sourceAbsoluteId: "fb7bc93a-17c1-467c-951d-58bf119c1967",
        sourceRelativeId: "fb7bc93a-17c1-467c-951d-58bf119c1967",
        statusTag: RegisterStatusTag.success,
        statusMeta: undefined,
        entity: {
            success: true,
        },
        meta: undefined,
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            apdaterId: "testAdapter",
        },
    },
    {
        id: "96a0a645-5bd7-46b3-aab5-0f30de460684",
        entityType: "resultClass",
        sourceAbsoluteId: "b056be4c-595e-419d-aa2f-c6607cca738b",
        sourceRelativeId: "b056be4c-595e-419d-aa2f-c6607cca738b",
        statusTag: RegisterStatusTag.success,
        statusMeta: undefined,
        entity: {
            success: true,
        },
        meta: undefined,
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            apdaterId: "testAdapter",
        },
    },
]
const mockInitialStatus = {
    definitionId: "testLoader",
    definitionType: "LocalAdapterLoaderDefinition",
    id: "testAdapter",
    outputType: "resultClass",
    runOptions: null,
    statusSummary: null,
    syncContext: { apdaterId: "testAdapter", stepId: "testStep", flowId: "testFlow" }
}
const mockFinalSummary = {
    output_rows: 2,
    rows_failed: 0,
    rows_invalid: 0,
    rows_skipped: 0,
    rows_success: 2,
}
const mockFinalStatus = {
    ...mockInitialStatus,
    statusSummary: mockFinalSummary
}

export const localAdapterLoaderMocks = { mockInitialStatus, mockFinalStatus, mockFinalSummary, mockFinalRegisters, mockInitialRegisters, mockEntities }