import { LocalAdapterFlexDefinition } from "../../../src/interactors/adapters/definitions/localAdapterFlex";
import { EntityFetcher, RegisterDataFilter, ValidationStatusTag } from "../../../src/interactors/adapters/definitions/types";
import { AdapterStatus, AdapterStatusSummary, AdapterStatusTag, InputEntity } from "../../../src/interactors/adapters/types";
import { Entity, Register, RegisterStatusTag } from "../../../src/interactors/registers/types";
import { case4Mocks } from "../localAdapterLoaderMocks/case4Mocks";

type result2Class = {
    successTotal: number
}
const mockInitialRegisters: Register<Entity>[] = case4Mocks.mockFinalRegisters
const inputEntities: InputEntity<result2Class>[] = [
    { successTotal: 1 }
];
export const case5Definition: LocalAdapterFlexDefinition<result2Class> = {
    id: "case5Flex",
    outputType: "result2Class",
    definitionType: "LocalAdapterFlexDefinition",
    async entitiesGet(entityFetcher: EntityFetcher) {
        const filter: RegisterDataFilter = {
            registerType: "resultClass",
            registerStatus: RegisterStatusTag.success
        };
        const entities = await entityFetcher.getEntities(filter);
        return [{
            successTotal: entities.length
        }];
    },
    async entityValidate(outputEntity: result2Class | null) {
        return ValidationStatusTag.valid
    }
}
const mockNewRegisters: Register<Entity>[] = [
    {
        id: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea644",
        entityType: "result2Class",
        sourceAbsoluteId: "fb7bc93a-17c1-467c-951d-58bf119c1967",
        sourceRelativeId: "fb7bc93a-17c1-467c-951d-58bf119c1967",
        statusTag: RegisterStatusTag.success,
        statusMeta: null,
        entity: {
            successTotal: 1,
        },
        meta: null,
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            apdaterId: "testAdapter",
        },
    }
]
const mockFinalRegisters: Register<Entity>[] = [
    ...mockInitialRegisters,
    ...mockNewRegisters
]
const mockInitialStatus: AdapterStatus = {
    definitionId: "case5Flex",
    definitionType: "LocalAdapterFlexDefinition",
    id: "testAdapter",
    outputType: "result2Class",
    runOptions: null,
    statusSummary: null,
    syncContext: { apdaterId: "testAdapter", stepId: "testStep", flowId: "testFlow" },
    statusTag: AdapterStatusTag.pending,
    statusMeta: null
}
const mockFinalSummary: AdapterStatusSummary = {
    output_rows: 1,
    rows_failed: 0,
    rows_invalid: 0,
    rows_skipped: 0,
    rows_success: 1,
}
const mockFinalStatus: AdapterStatus = {
    ...mockInitialStatus,
    statusSummary: mockFinalSummary,
    statusTag: AdapterStatusTag.success,
}

export const case5Mocks = { mockInitialStatus, mockFinalStatus, mockFinalRegisters, mockInitialRegisters, inputEntities, mockNewRegisters }