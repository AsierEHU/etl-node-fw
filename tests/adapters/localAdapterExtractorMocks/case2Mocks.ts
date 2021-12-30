import { LocalAdapterExtractorDefinition } from "../../../src/interactors/adapters/processes/localAdapter/localAdapterExtractor";
import { InputEntity, ValidationStatusTag, ToFixEntity } from "../../../src/interactors/adapters/processes/localAdapter/types";
import { AdapterStatus, AdapterStatusTag } from "../../../src/interactors/adapters/runners/types";
import { Register } from "../../../src/interactors/registers/types";


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
    syncContext: { adapterId: "testAdapter", stepId: "testStep", flowId: "testFlow" },
    timeStarted: null,
    timeFinished: null
}
const mockFinalSummary = null
const mockFinalStatus: AdapterStatus = {
    ...mockInitialStatus,
    statusSummary: mockFinalSummary,
    statusTag: AdapterStatusTag.failed,
    statusMeta: "Getting entities error",
    timeStarted: null,
    timeFinished: null
}

export const case2Mocks = { mockInitialStatus, mockFinalStatus, mockFinalRegisters, inputEntities, mockInitialRegisters, mockNewRegisters }