import { LocalAdapterExtractorDefinition, ValidationStatusTag, ToFixEntity, AdapterStatus, RegisterStats, reservedEntityTypes } from "../../../src";
import { StatusTag } from "../../../src/business/processStatus";
import { Register, RegisterStatusTag } from "../../../src/business/register";

type inputClass = {
    field: string,
    y: number,
}
export const case6Definition: LocalAdapterExtractorDefinition<inputClass> = {
    id: "case6Extractor",
    definitionType: "LocalAdapterExtractorDefinition",
    outputType: "inputClass",
    async entitiesGet(entityFetcher) {
        const configEntity = await entityFetcher.getFlowConfig()
        return [{ field: configEntity.msg, y: 50 }]
    },
    async entityValidate(entity: inputClass | null) {
        return ValidationStatusTag.valid;
    },
    async entityFix(toFixEntity: ToFixEntity<inputClass>) {
        return null
    },
}
const mockInitialRegisters: Register[] = [{
    id: "fb7bc93a-17c1-467c-951d-58bf119c1955",
    entityType: reservedEntityTypes.flowConfig,
    sourceAbsoluteId: "fb7bc93a-17c1-467c-951d-58bf119c1955",
    sourceRelativeId: "fb7bc93a-17c1-467c-951d-58bf119c1955",
    sourceEntityId: null,
    statusTag: RegisterStatusTag.success,
    statusMeta: null,
    entity: { msg: "Push config test" },
    meta: null,
    date: new Date(),
    definitionId: case6Definition.id,
    syncContext: {
        flowId: "testFlow",
    },
}]
const inputEntities = {
    ["inputClass"]: [
        { field: "Push config test", y: 50 }
    ]
}
const mockNewRegisters: Register[] = [{
    id: "fb7bc93a-17c1-467c-951d-58bf119c1922",
    entityType: "inputClass",
    sourceAbsoluteId: "fb7bc93a-17c1-467c-951d-58bf119c1922",
    sourceRelativeId: "fb7bc93a-17c1-467c-951d-58bf119c1922",
    sourceEntityId: null,
    statusTag: RegisterStatusTag.success,
    statusMeta: null,
    entity: { field: "Push config test", y: 50 },
    meta: null,
    date: new Date(),
    definitionId: case6Definition.id,
    syncContext: {
        flowId: "testFlow",
        stepId: "testStep",
        adapterId: "testAdapter",
    },
}]
const mockFinalRegisters: Register[] = [
    ...mockInitialRegisters,
    ...mockNewRegisters
]
const mockInitialStatus: AdapterStatus = {
    definitionId: "case6Extractor",
    definitionType: "LocalAdapterExtractorDefinition",
    id: "testAdapter",
    outputType: "inputClass",
    runOptions: null,
    statusSummary: null,
    statusTag: StatusTag.pending,
    statusMeta: null,
    syncContext: { adapterId: "testAdapter", stepId: "testStep", flowId: "testFlow" },
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
    statusTag: StatusTag.success,
    timeStarted: null,
    timeFinished: null
}
export const case6Mocks = { mockInitialStatus, mockFinalStatus, mockFinalRegisters, inputEntities, mockInitialRegisters, mockNewRegisters }