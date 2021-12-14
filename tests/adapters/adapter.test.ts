import { EventEmitter } from "stream";
import { VolatileRegisterDataAccess } from "../../src/dataAccess/volatile";
import { AdapterFactory } from "../../src/interactors/adapters/factory";
import { AdapterStatus } from "../../src/interactors/adapters/types";
import { Entity, Register, RegisterStatusTag } from "../../src/interactors/registers/types";
import { testExtractor, testFlex, testLoader, testTransformer } from "./adapters";


//Adapter dependencies
let adapterPresenter = new EventEmitter()
let adapterDefinitions = [testExtractor, testTransformer, testLoader, testFlex];
let registerDataAccess = new VolatileRegisterDataAccess();
let adapterFactory = new AdapterFactory(adapterDefinitions)
let adapterDependencies = {
    adapterPresenter,
    registerDataAccess,
}

//Mocked objects
const mockExtractorAdapterStatus = {
    definitionId: "testExtractor",
    definitionType: "MyAdapterExtractorDefinition",
    id: "e716bb62-5282-46b5-8f87-1015538e2016",
    outputType: "inputClass",
    runOptions: null,
    statusSummary: null,
    syncContext: { apdaterId: "e716bb62-5282-46b5-8f87-1015538e2016" }
}
const mockEctractorAdapterSummary = {
    output_rows: 5,
    rows_failed: 0,
    rows_invalid: 1,
    rows_skipped: 1,
    rows_success: 3,
}
const mockExtractorAdapterStatusFinal = {
    ...mockExtractorAdapterStatus,
    statusSummary: mockEctractorAdapterSummary
}
const mockRegisters: Register<Entity>[] = [
    {
        id: "fb7bc93a-17c1-467c-951d-58bf119c1967",
        entityType: "inputClass",
        sourceAbsoluteId: "fb7bc93a-17c1-467c-951d-58bf119c1967",
        sourceRelativeId: "fb7bc93a-17c1-467c-951d-58bf119c1967",
        statusTag: RegisterStatusTag.success,
        statusMeta: null,
        entity: {
            field: "Raw Object text",
            y: 23,
        },
        meta: "rawMocked to success",
        context: {
            apdaterId: "3ba7f2b2-841d-4b7f-aa8e-e301f208556f",
        },
    },
    {
        id: "4e804c38-a540-4929-bc0d-0f9c51a1c203",
        entityType: "inputClass",
        sourceAbsoluteId: "4e804c38-a540-4929-bc0d-0f9c51a1c203",
        sourceRelativeId: "4e804c38-a540-4929-bc0d-0f9c51a1c203",
        statusTag: RegisterStatusTag.invalid,
        statusMeta: {
            type: "null object",
            action: "trigger alarm",
            severity: "high",
        },
        entity: null,
        meta: null,
        context: {
            apdaterId: "3ba7f2b2-841d-4b7f-aa8e-e301f208556f",
        },
    },
    {
        id: "b056be4c-595e-419d-aa2f-c6607cca738b",
        entityType: "inputClass",
        sourceAbsoluteId: "b056be4c-595e-419d-aa2f-c6607cca738b",
        sourceRelativeId: "b056be4c-595e-419d-aa2f-c6607cca738b",
        statusTag: RegisterStatusTag.success,
        statusMeta: {
            type: "0 error",
            action: "trigger alarm",
            severity: "low",
            fixMeta: {
                note: "Fixed changing to 1",
            },
        },
        entity: {
            field: "Raw Object text 2",
            y: 1,
        },
        meta: null,
        context: {
            apdaterId: "3ba7f2b2-841d-4b7f-aa8e-e301f208556f",
        },
    },
    {
        id: "8d07acc6-1765-4862-8bb9-9ee1e9809e64",
        entityType: "inputClass",
        sourceAbsoluteId: "8d07acc6-1765-4862-8bb9-9ee1e9809e64",
        sourceRelativeId: "8d07acc6-1765-4862-8bb9-9ee1e9809e64",
        statusTag: RegisterStatusTag.skipped,
        statusMeta: null,
        entity: {
            field: "Raw Object text 3",
            y: -34,
        },
        meta: "rawMocked to skip",
        context: {
            apdaterId: "3ba7f2b2-841d-4b7f-aa8e-e301f208556f",
        },
    },
    {
        id: "b349def1-3c4e-4ddf-8378-2a3b3bd1c173",
        entityType: "inputClass",
        sourceAbsoluteId: "b349def1-3c4e-4ddf-8378-2a3b3bd1c173",
        sourceRelativeId: "b349def1-3c4e-4ddf-8378-2a3b3bd1c173",
        statusTag: RegisterStatusTag.success,
        statusMeta: null,
        entity: {
            field: "Raw Object text 3",
            y: 30,
        },
        meta: "rawMocked to fail",
        context: {
            apdaterId: "3ba7f2b2-841d-4b7f-aa8e-e301f208556f",
        },
    },
]

const statusTest = (adapterStatus: AdapterStatus, mockStatus: AdapterStatus,) => {
    expect(adapterStatus.id).not.toBeNull()
    expect(adapterStatus.syncContext.apdaterId).not.toBeNull()
    expect(adapterStatus.id).toEqual(adapterStatus.syncContext.apdaterId)
    adapterStatus.id = mockStatus.id
    adapterStatus.syncContext.apdaterId = mockStatus.id
    expect(adapterStatus).toEqual(mockStatus)
}

const registerTest = (register: Register<Entity>, mockRegister: Register<Entity>) => {
    expect(register.id).not.toBeNull()
    expect(register.context.apdaterId).not.toBeNull()
    expect(register.sourceAbsoluteId).not.toBeNull()
    expect(register.sourceRelativeId).not.toBeNull()
    register.id = mockRegister.id
    register.sourceAbsoluteId = mockRegister.sourceAbsoluteId
    register.sourceRelativeId = mockRegister.sourceRelativeId
    register.context.apdaterId = mockRegister.context.apdaterId
    expect(register).toEqual(mockRegister)
}


describe("MyExtractorAdapter", () => {

    beforeEach(() => {
        adapterPresenter.removeAllListeners("adapterStatus")
        registerDataAccess = new VolatileRegisterDataAccess()
        adapterDependencies = {
            adapterPresenter,
            registerDataAccess,
        }
    });

    test("Initial status", async () => {
        const adapter1 = adapterFactory.createAdapter("testExtractor", adapterDependencies)
        const adapterStatus = await adapter1.getStatus();
        statusTest(adapterStatus, mockExtractorAdapterStatus)
    })

    test("Initial presenter", (done) => {
        adapterPresenter.on("adapterStatus", (adapterStatus) => {
            statusTest(adapterStatus, mockExtractorAdapterStatus)
            done()
        })
        adapterFactory.createAdapter("testExtractor", adapterDependencies)
    })

    test("Final status", async () => {
        const adapter1 = adapterFactory.createAdapter("testExtractor", adapterDependencies)
        const adapterStatusSummary = await adapter1.runOnce();
        expect(adapterStatusSummary).toEqual(mockEctractorAdapterSummary)
    })

    test("Final presenter", (done) => {
        const adapter1 = adapterFactory.createAdapter("testExtractor", adapterDependencies)
        adapterPresenter.on("adapterStatus", (adapterStatus) => {
            statusTest(adapterStatus, mockExtractorAdapterStatusFinal)
            done()
        })
        adapter1.runOnce()
    })

    test("Run more than once", async () => {
        const adapter1 = adapterFactory.createAdapter("testExtractor", adapterDependencies)
        adapter1.runOnce()
        await expect(adapter1.runOnce()).rejects.toEqual(new Error("Run once"))
    });

    test("db result", async () => {
        const adapter1 = adapterFactory.createAdapter("testExtractor", adapterDependencies)
        await adapter1.runOnce()
        const registers = await registerDataAccess.getAll()
        registers.forEach((register, index) => {
            registerTest(register, mockRegisters[index])
        })
    });

    test("runOptions...", () => {

    })
})

