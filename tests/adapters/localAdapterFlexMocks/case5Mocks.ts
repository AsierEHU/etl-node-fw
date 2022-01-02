import { LocalAdapterFlexDefinition } from "../../../src/interactors/adapters/processes/localAdapter/localAdapterFlex";
import { ValidationStatusTag } from "../../../src/interactors/adapters/processes/localAdapter/types";
import { AdapterStatus, AdapterStatusTag } from "../../../src/interactors/adapters/runners/types";
import { Register, EntityFetcher, RegisterDataFilter, RegisterStatusTag, RegisterStats, InputEntity } from "../../../src/interactors/registers/types";
import { case4Mocks } from "../localAdapterLoaderMocks/case4Mocks";


type result2Class = {
    successTotal: number
}
const mockInitialRegisters: Register[] = case4Mocks.mockFinalRegisters
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
    definitionId: "case5Flex",
    definitionType: "LocalAdapterFlexDefinition",
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