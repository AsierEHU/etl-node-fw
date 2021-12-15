import { LocalAdapterExtractorDefinition } from "../../src/interactors/adapters/definitions/localAdapterExtractor";
import { ToFixEntity, ValidationStatusTag } from "../../src/interactors/adapters/definitions/types";
import { InputEntity } from "../../src/interactors/adapters/types";
import { Entity, Register, RegisterStatusTag } from "../../src/interactors/registers/types";

type inputClass = {
    field: string,
    y: number,
}
const mockInitialRegisters: Register<Entity>[] = []
const mockEntities: InputEntity[] = [
    {
        entity: {
            field: "Raw Object text",
            y: 23,
        },
        meta: "rawMocked to success"
    },
    null,
    {
        field: "Raw Object text 2",
        y: 0,
    },
    {
        entity: {
            field: "Raw Object text 3",
            y: -34,
        },
        meta: "rawMocked to skip"
    },
    {
        entity: {
            field: "Raw Object text 3",
            y: 30,
        },
        meta: "rawMocked to fail"
    },
    {
        field: "Raw Object text 4",
        y: -1,
    }
];
export const localAdapterExtractorDefinition: LocalAdapterExtractorDefinition<inputClass> = {
    id: "testExtractor",
    definitionType: "LocalAdapterExtractorDefinition",
    outputType: "inputClass",
    async entitiesGet() {
        return mockEntities;
    },
    async entityValidate(entity: inputClass | null) {
        if (entity == null) {
            return {
                statusTag: ValidationStatusTag.invalid,
                meta: {
                    type: "null object",
                    action: "trigger alarm",
                    severity: "high"
                }
            };
        }
        else if (entity.y == -1) {
            throw new Error("-1 exception")
        }
        else if (entity.y < 0) {
            return ValidationStatusTag.skipped;
        }
        else if (entity.y == 0) {
            return {
                statusTag: ValidationStatusTag.invalid,
                meta: {
                    type: "0 error",
                    action: "trigger alarm",
                    severity: "low"
                }
            };
        }
        else {
            return ValidationStatusTag.valid;
        }
    },
    async entityFix(toFixEntity: ToFixEntity<inputClass>) {
        const entity = toFixEntity.entity;
        if (!entity) {
            return null;
        }
        else if (toFixEntity.validationMeta.type == "0 error") {
            entity.y = 1;
            return {
                entity,
                meta: {
                    note: "Fixed changing to 1"
                }
            };
        } else {
            return null;
        }
    },
}
const mockFinalRegisters: Register<Entity>[] = [
    {
        id: "fb7bc93a-17c1-467c-951d-58bf119c1967",
        entityType: "inputClass",
        sourceAbsoluteId: "fb7bc93a-17c1-467c-951d-58bf119c1967",
        sourceRelativeId: "fb7bc93a-17c1-467c-951d-58bf119c1967",
        statusTag: RegisterStatusTag.success,
        statusMeta: null,
        entity: {
            field: "Raw Object text",
            y: 23,
        },
        meta: "rawMocked to success",
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            apdaterId: "testAdapter",
        },
    },
    {
        id: "4e804c38-a540-4929-bc0d-0f9c51a1c203",
        entityType: "inputClass",
        sourceAbsoluteId: "4e804c38-a540-4929-bc0d-0f9c51a1c203",
        sourceRelativeId: "4e804c38-a540-4929-bc0d-0f9c51a1c203",
        statusTag: RegisterStatusTag.invalid,
        statusMeta: {
            type: "null object",
            action: "trigger alarm",
            severity: "high",
        },
        entity: null,
        meta: null,
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            apdaterId: "testAdapter",
        },
    },
    {
        id: "b056be4c-595e-419d-aa2f-c6607cca738b",
        entityType: "inputClass",
        sourceAbsoluteId: "b056be4c-595e-419d-aa2f-c6607cca738b",
        sourceRelativeId: "b056be4c-595e-419d-aa2f-c6607cca738b",
        statusTag: RegisterStatusTag.success,
        statusMeta: {
            type: "0 error",
            action: "trigger alarm",
            severity: "low",
            fixMeta: {
                note: "Fixed changing to 1",
            },
        },
        entity: {
            field: "Raw Object text 2",
            y: 1,
        },
        meta: null,
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            apdaterId: "testAdapter",
        },
    },
    {
        id: "8d07acc6-1765-4862-8bb9-9ee1e9809e64",
        entityType: "inputClass",
        sourceAbsoluteId: "8d07acc6-1765-4862-8bb9-9ee1e9809e64",
        sourceRelativeId: "8d07acc6-1765-4862-8bb9-9ee1e9809e64",
        statusTag: RegisterStatusTag.skipped,
        statusMeta: null,
        entity: {
            field: "Raw Object text 3",
            y: -34,
        },
        meta: "rawMocked to skip",
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            apdaterId: "testAdapter",
        },
    },
    {
        id: "b349def1-3c4e-4ddf-8378-2a3b3bd1c173",
        entityType: "inputClass",
        sourceAbsoluteId: "b349def1-3c4e-4ddf-8378-2a3b3bd1c173",
        sourceRelativeId: "b349def1-3c4e-4ddf-8378-2a3b3bd1c173",
        statusTag: RegisterStatusTag.success,
        statusMeta: null,
        entity: {
            field: "Raw Object text 3",
            y: 30,
        },
        meta: "rawMocked to fail",
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            apdaterId: "testAdapter",
        },
    },
    {
        id: "df4hsdf-564e-4dgh-8458-2hgfff5633dss",
        entityType: "inputClass",
        sourceAbsoluteId: "df4hsdf-564e-4dgh-8458-2hgfff5633dss",
        sourceRelativeId: "df4hsdf-564e-4dgh-8458-2hgfff5633dss",
        statusTag: RegisterStatusTag.failed,
        statusMeta: "-1 exception",
        entity: {
            field: "Raw Object text 4",
            y: -1,
        },
        meta: null,
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            apdaterId: "testAdapter",
        },
    },
]
const mockInitialStatus = {
    definitionId: "testExtractor",
    definitionType: "LocalAdapterExtractorDefinition",
    id: "testAdapter",
    outputType: "inputClass",
    runOptions: null,
    statusSummary: null,
    syncContext: { apdaterId: "testAdapter", stepId: "testStep", flowId: "testFlow" }
}
const mockFinalSummary = {
    output_rows: 6,
    rows_failed: 1,
    rows_invalid: 1,
    rows_skipped: 1,
    rows_success: 3,
}
const mockFinalStatus = {
    ...mockInitialStatus,
    statusSummary: mockFinalSummary
}

export const localAdapterExtractorMocks = { mockInitialStatus, mockFinalStatus, mockFinalSummary, mockFinalRegisters, mockEntities, mockInitialRegisters }