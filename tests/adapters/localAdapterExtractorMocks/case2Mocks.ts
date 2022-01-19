import { LocalAdapterExtractorDefinition, ValidationStatusTag, ToFixEntity, AdapterPresenter } from "../../../src";
import { ProcessStatus, ProcessType, StatusTag } from "../../../src/business/processStatus";
import { Register } from "../../../src/business/register";

type inputClass = {
    field: string,
    y: number,
}
const mockInitialRegisters: Register[] = []
const inputEntities = {};
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
const mockInitialStatus: ProcessStatus = {
    definitionId: "case2Extractor",
    id: "testAdapter",
    runOptions: null,
    syncContext: { adapterId: "testAdapter", stepId: "testStep", flowId: "testFlow" },
    statusTag: StatusTag.pending,
    statusMeta: null,
    timeStarted: null,
    timeFinished: null,
    processType: ProcessType.adapter
}
const mockFinalStatus: ProcessStatus = {
    ...mockInitialStatus,
    statusTag: StatusTag.failed,
    statusMeta: "Getting entities error",
    timeStarted: new Date(),
    timeFinished: new Date(),
}
const mockInitialPresenter: AdapterPresenter = {
    definitionId: "case2Extractor",
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
const mockFinalSummary = {
    registers_total: 0,
    registers_success: 0,
    registers_failed: 0,
    registers_invalid: 0,
    registers_skipped: 0,
}
const mockFinalPresenter: AdapterPresenter = {
    ...mockInitialPresenter,
    statusSummary: mockFinalSummary,
    statusTag: StatusTag.failed,
    statusMeta: "Getting entities error",
    timeStarted: null,
    timeFinished: null
}

export const case2Mocks = { mockInitialStatus, mockFinalStatus, mockInitialPresenter, mockFinalPresenter, mockFinalRegisters, inputEntities, mockInitialRegisters, mockNewRegisters }