import { LocalAdapterFlexDefinition } from "../../src/interactors/adapters/definitions/localAdapterFlex";
import { EntityFetcher, RegisterDataFilter, ValidationStatusTag } from "../../src/interactors/adapters/definitions/types";
import { InputEntity } from "../../src/interactors/adapters/types";
import { Entity, Register, RegisterStatusTag } from "../../src/interactors/registers/types";
import { localAdapterLoaderMocks } from "./localAdapterLoaderMocks";

type result2Class = {
    successTotal: number
}
const mockInitialRegisters: Register<Entity>[] = localAdapterLoaderMocks.mockFinalRegisters
const inputEntities: InputEntity<result2Class>[] = [
    { successTotal: 1 }
];
export const localAdapterFlexDefinition: LocalAdapterFlexDefinition<result2Class> = {
    id: "testFlex",
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
const mockFinalRegisters: Register<Entity>[] = [
    ...mockInitialRegisters,
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
const mockInitialStatus = {
    definitionId: "testFlex",
    definitionType: "LocalAdapterFlexDefinition",
    id: "testAdapter",
    outputType: "result2Class",
    runOptions: null,
    statusSummary: null,
    syncContext: { apdaterId: "testAdapter", stepId: "testStep", flowId: "testFlow" }
}
const mockFinalSummary = {
    output_rows: 1,
    rows_failed: 0,
    rows_invalid: 0,
    rows_skipped: 0,
    rows_success: 1,
}
const mockFinalStatus = {
    ...mockInitialStatus,
    statusSummary: mockFinalSummary
}

export const localAdapterFlexMocks = { mockInitialStatus, mockFinalStatus, mockFinalSummary, mockFinalRegisters, mockInitialRegisters, inputEntities }