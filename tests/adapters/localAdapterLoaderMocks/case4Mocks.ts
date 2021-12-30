import { LocalAdapterLoaderDefinition } from "../../../src/interactors/adapters/processes/localAdapter/localAdapterLoader";
import { InputEntity, ValidationResult, ValidationStatusTag } from "../../../src/interactors/adapters/processes/localAdapter/types";
import { AdapterStatus, AdapterStatusTag } from "../../../src/interactors/adapters/runners/types";
import { Register, RegisterStatusTag, RegisterStats } from "../../../src/interactors/registers/types";
import { case3Mocks } from "../localAdapterTranformerMocks/case3Mocks";


type outputClass = {
    text: string,
    others: {
        x: number,
    }
}

type resultClass = {
    success: boolean,
}

const mockInitialRegisters: Register[] = case3Mocks.mockFinalRegisters
const inputEntities: InputEntity<outputClass>[] = [
    {
        $entity: {
            text: "Raw Object text",
            others: {
                x: 23,
            },
        },
        $id: "userDefinedId1"
    },
    {
        text: "Raw Object text 2",
        others: {
            x: 1,
        },
    }
];
export const case4Definition: LocalAdapterLoaderDefinition<outputClass, resultClass> = {
    id: "case4Loader",
    definitionType: "LocalAdapterLoaderDefinition",
    inputType: "outputClass",
    outputType: "resultClass",
    async entityLoad(entity: outputClass) {
        if (entity.others.x == 23)
            return { success: true } as resultClass;
        else if (entity.others.x == 1) {
            return { success: false } as resultClass;
        } else {
            throw Error("Loading error");
        }
    },
    async entityValidate(inputEntity: resultClass | null): Promise<ValidationResult | ValidationStatusTag> {
        if (inputEntity?.success == true) {
            return ValidationStatusTag.valid
        } else {
            return ValidationStatusTag.invalid
        }
    }
}
const mockNewRegisters: Register[] = [
    {
        id: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea643",
        entityType: "resultClass",
        sourceAbsoluteId: "fb7bc93a-17c1-467c-951d-58bf119c1967",
        sourceRelativeId: "fb7bc93a-17c1-467c-951d-58bf119c1967",
        sourceEntityId: "userDefinedId1",
        statusTag: RegisterStatusTag.success,
        statusMeta: null,
        entity: {
            success: true,
        },
        meta: null,
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            adapterId: "testAdapter",
        },
    },
    {
        id: "96a0a645-5bd7-46b3-aab5-0f30de460685",
        entityType: "resultClass",
        sourceAbsoluteId: "b056be4c-595e-419d-aa2f-c6607cca738b",
        sourceRelativeId: "b056be4c-595e-419d-aa2f-c6607cca738b",
        sourceEntityId: null,
        statusTag: RegisterStatusTag.invalid,
        statusMeta: null,
        entity: {
            success: false,
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
    definitionId: "case4Loader",
    definitionType: "LocalAdapterLoaderDefinition",
    id: "testAdapter",
    outputType: "resultClass",
    runOptions: null,
    statusSummary: null,
    syncContext: { adapterId: "testAdapter", stepId: "testStep", flowId: "testFlow" },
    statusTag: AdapterStatusTag.pending,
    statusMeta: null,
    timeStarted: null,
    timeFinished: null
}
const mockFinalSummary: RegisterStats = {
    output_rows: 2,
    rows_failed: 0,
    rows_invalid: 1,
    rows_skipped: 0,
    rows_success: 1,
}
const mockFinalStatus: AdapterStatus = {
    ...mockInitialStatus,
    statusSummary: mockFinalSummary,
    statusTag: AdapterStatusTag.success,
    timeStarted: null,
    timeFinished: null
}

export const case4Mocks = { mockInitialStatus, mockFinalStatus, mockFinalRegisters, mockInitialRegisters, inputEntities, mockNewRegisters }