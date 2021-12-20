import { LocalAdapterExtractorDefinition } from "../../../src/interactors/adapters/definitions/localAdapterExtractor";
import { ToFixEntity, ValidationStatusTag } from "../../../src/interactors/adapters/definitions/types";
import { AdapterStatus, AdapterStatusSummary, AdapterStatusTag, InputEntity } from "../../../src/interactors/adapters/types";
import {  Register } from "../../../src/interactors/registers/types";

type inputClass = {
    field: string,
    y: number,
}
const mockInitialRegisters: Register[] = []
const inputEntities: InputEntity<inputClass>[] = [];
export const case2Definition: LocalAdapterExtractorDefinition<inputClass> = {
    id: "case2Extractor",
    definitionType: "LocalAdapterExtractorDefinition",
    outputType: "inputClass",
    async entitiesGet() {
        throw new Error("Getting entities error")
    },
    async entityValidate(entity: inputClass | null) {
        return ValidationStatusTag.invalid;
    },
    async entityFix(toFixEntity: ToFixEntity<inputClass>) {
        return null
    },
}
const mockNewRegisters: Register[] = []
const mockFinalRegisters: Register[] = [
    ...mockInitialRegisters,
    ...mockNewRegisters
]
const mockInitialStatus: AdapterStatus = {
    definitionId: "case2Extractor",
    definitionType: "LocalAdapterExtractorDefinition",
    id: "testAdapter",
    outputType: "inputClass",
    runOptions: null,
    statusSummary: null,
    statusTag: AdapterStatusTag.pending,
    statusMeta: null,
    syncContext: { apdaterId: "testAdapter", stepId: "testStep", flowId: "testFlow" },
}
const mockFinalSummary = null
const mockFinalStatus: AdapterStatus = {
    ...mockInitialStatus,
    statusSummary: mockFinalSummary,
    statusTag: AdapterStatusTag.failed,
    statusMeta: "Getting entities error"
}

export const case2Mocks = { mockInitialStatus, mockFinalStatus, mockFinalRegisters, inputEntities, mockInitialRegisters, mockNewRegisters }