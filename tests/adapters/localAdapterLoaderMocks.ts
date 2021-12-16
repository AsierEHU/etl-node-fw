import { LocalAdapterLoaderDefinition } from "../../src/interactors/adapters/definitions/localAdapterLoader";
import { ValidationResult, ValidationStatusTag } from "../../src/interactors/adapters/definitions/types";
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
const inputEntities: InputEntity<outputClass>[] = [
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
        if (entity.others.x == 23)
            return { success: true } as resultClass;
        else if (entity.others.x == 1) {
            return { success: false } as resultClass;
        } else {
            throw Error("Loading error");
        }
    },
    async entityValidate(inputEntity: resultClass | null): Promise<ValidationResult | ValidationStatusTag> {
        if (inputEntity?.success == true) {
            return ValidationStatusTag.valid
        } else {
            return ValidationStatusTag.invalid
        }
    }
}
const mockNewRegisters: Register<Entity>[] = [
    {
        id: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea643",
        entityType: "resultClass",
        sourceAbsoluteId: "fb7bc93a-17c1-467c-951d-58bf119c1967",
        sourceRelativeId: "fb7bc93a-17c1-467c-951d-58bf119c1967",
        statusTag: RegisterStatusTag.success,
        statusMeta: null,
        entity: {
            success: true,
        },
        meta: null,
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            apdaterId: "testAdapter",
        },
    },
    {
        id: "96a0a645-5bd7-46b3-aab5-0f30de460685",
        entityType: "resultClass",
        sourceAbsoluteId: "b056be4c-595e-419d-aa2f-c6607cca738b",
        sourceRelativeId: "b056be4c-595e-419d-aa2f-c6607cca738b",
        statusTag: RegisterStatusTag.invalid,
        statusMeta: null,
        entity: {
            success: false,
        },
        meta: null,
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            apdaterId: "testAdapter",
        },
    },
]
const mockFinalRegisters: Register<Entity>[] = [
    ...mockInitialRegisters,
    ...mockNewRegisters
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
    rows_invalid: 1,
    rows_skipped: 0,
    rows_success: 1,
}
const mockFinalStatus = {
    ...mockInitialStatus,
    statusSummary: mockFinalSummary
}

export const localAdapterLoaderMocks = { mockInitialStatus, mockFinalStatus, mockFinalSummary, mockFinalRegisters, mockInitialRegisters, inputEntities, mockNewRegisters }