import { LocalAdapterExtractorDefinition } from "../../../src/interactors/adapters/definitions/localAdapterExtractor";
import { ToFixEntity, ValidationStatusTag } from "../../../src/interactors/adapters/definitions/types";
import { InputEntity } from "../../../src/interactors/adapters/types";
import { Entity, Register, RegisterStatusTag } from "../../../src/interactors/registers/types";

type inputClass = {
    field: string,
    y: number,
}
const mockInitialRegisters: Register<Entity>[] = []
const inputEntities: InputEntity<inputClass>[] = [];
export const case2Definition: LocalAdapterExtractorDefinition<inputClass> = {
    id: "case2Extractor",
    definitionType: "LocalAdapterExtractorDefinition",
    outputType: "inputClass",
    async entitiesGet() {
        throw new Error("My custom run error")
    },
    async entityValidate(entity: inputClass | null) {
        return ValidationStatusTag.valid;
    },
    async entityFix(toFixEntity: ToFixEntity<inputClass>) {
        return null
    },
}
const mockNewRegisters: Register<Entity>[] = []
const mockFinalRegisters: Register<Entity>[] = [
    ...mockInitialRegisters,
    ...mockNewRegisters
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
    output_rows: 0,
    rows_failed: 0,
    rows_invalid: 0,
    rows_skipped: 0,
    rows_success: 0,
}
const mockFinalStatus = {
    ...mockInitialStatus,
    statusSummary: mockFinalSummary
}

export const case2Mocks = { mockInitialStatus, mockFinalStatus, mockFinalSummary, mockFinalRegisters, inputEntities, mockInitialRegisters, mockNewRegisters }