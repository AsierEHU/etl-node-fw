import { LocalAdapterExtractorDefinition } from "../../../src/interactors/adapters/processes/localAdapter/localAdapterExtractor";
import { InputEntity, ValidationStatusTag, ToFixEntity } from "../../../src/interactors/adapters/processes/localAdapter/types";
import { AdapterStatus, AdapterStatusTag } from "../../../src/interactors/adapters/runners/types";
import { Register, RegisterStatusTag, RegisterStatusSummary } from "../../../src/interactors/registers/types";

type inputClass = {
    field: string,
    y: number,
}
const mockInitialRegisters: Register[] = []
const inputEntities: InputEntity<inputClass>[] = [
    {
        $entity: {
            field: "Raw Object text",
            y: 23,
        },
        $meta: "rawMocked to success",
        $id: "userDefinedId1"
    },
    null,
    {
        field: "Raw Object text 2",
        y: 0,
    },
    {
        $entity: {
            field: "Raw Object text 3",
            y: -34,
        },
        $meta: "rawMocked to skip"
    },
    {
        $entity: {
            field: "Raw Object text 3",
            y: 30,
        },
        $meta: "rawMocked to fail"
    },
    {
        field: "Raw Object text 4",
        y: -1,
    },
    {
        field: "Raw Object text 5",
        y: 1,
    },
];
export const case1Definition: LocalAdapterExtractorDefinition<inputClass> = {
    id: "case1Extractor",
    definitionType: "LocalAdapterExtractorDefinition",
    outputType: "inputClass",
    async entitiesGet() {
        return inputEntities;
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
        } else if (entity.y == 1) {
            return {
                statusTag: ValidationStatusTag.invalid,
                meta: {
                    type: "1 error",
                    action: "trigger alarm",
                    severity: "high"
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
        } else if (toFixEntity.validationMeta.type == "1 error") {
            throw new Error("Exception Fixing")
        } else {
            return null;
        }
    },
}
const mockNewRegisters: Register[] = [
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
        statusMeta: { note: "Fixed changing to 1" },
        entity: {
            field: "Raw Object text 2",
            y: 1,
        },
        meta: null,
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
    definitionId: "case1Extractor",
    definitionType: "LocalAdapterExtractorDefinition",
    id: "testAdapter",
    outputType: "inputClass",
    runOptions: null,
    statusSummary: {
        output_rows: 0,
        rows_failed: 0,
        rows_invalid: 0,
        rows_skipped: 0,
        rows_success: 0,
    },
    syncContext: { adapterId: "testAdapter", stepId: "testStep", flowId: "testFlow" },
    statusTag: AdapterStatusTag.pending,
    statusMeta: null
}
const mockFinalSummary: RegisterStatusSummary = {
    output_rows: 7,
    rows_failed: 2,
    rows_invalid: 1,
    rows_skipped: 1,
    rows_success: 3,
}
const mockFinalStatus: AdapterStatus = {
    ...mockInitialStatus,
    statusSummary: mockFinalSummary,
    statusTag: AdapterStatusTag.success
}

export const case1Mocks = { mockInitialStatus, mockFinalStatus, mockFinalRegisters, inputEntities, mockInitialRegisters, mockNewRegisters }