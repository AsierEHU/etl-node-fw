import { EventEmitter } from "stream";
import { VolatileRegisterDataAccess } from "../../src/dataAccess/volatile";
import { AdapterFactory } from "../../src/interactors/adapters/factory";
import { AdapterDefinition, AdapterStatus, AdapterStatusSummary, MockEntity } from "../../src/interactors/adapters/types";
import { Entity, Register, RegisterDataContext, RegisterStatusTag } from "../../src/interactors/registers/types";
import { localAdapterExtractorMocks, localAdapterExtractorDefinition } from "./localAdapterExtractorMocks"


let adapterPresenter = new EventEmitter()
let adapterDefinitions = [localAdapterExtractorDefinition];
let registerDataAccess = new VolatileRegisterDataAccess();
let adapterFactory = new AdapterFactory(adapterDefinitions)
let syncContext: RegisterDataContext = {
    flowId: "testFlow",
    stepId: "testStep"
}
let adapterDependencies = {
    adapterPresenter,
    registerDataAccess,
    syncContext
}

const adapterTest = (
    definition: AdapterDefinition,
    mocks: {
        mockInitialStatus: AdapterStatus,
        mockFinalStatus: AdapterStatus,
        mockFinalSummary: AdapterStatusSummary,
        mockRegisters: Register<Entity>[],
        mockEntities: MockEntity[]
    }
) => {
    describe(definition.definitionType, () => {

        beforeEach(() => {
            adapterPresenter.removeAllListeners("adapterStatus")
            registerDataAccess = new VolatileRegisterDataAccess()
            adapterDependencies = {
                adapterPresenter,
                registerDataAccess,
                syncContext,
            }
        });

        test("Initial status", async () => {
            const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            const adapterStatus = await adapter1.getStatus();
            statusEqual(adapterStatus, mocks.mockInitialStatus)
        })

        test("Initial presenter", (done) => {
            adapterPresenter.on("adapterStatus", (adapterStatus) => {
                statusEqual(adapterStatus, mocks.mockInitialStatus)
                done()
            })
            adapterFactory.createAdapter(definition.id, adapterDependencies)
        })

        test("Final summary", async () => {
            const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            const adapterStatusSummary = await adapter1.runOnce();
            expect(adapterStatusSummary).toEqual(mocks.mockFinalSummary)
        })

        test("Final presenter", (done) => {
            const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            adapterPresenter.on("adapterStatus", (adapterStatus) => {
                statusEqual(adapterStatus, mocks.mockFinalStatus)
                done()
            })
            adapter1.runOnce()
        })

        test("Run once exception", async () => {
            const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            adapter1.runOnce()
            await expect(adapter1.runOnce()).rejects.toEqual(new Error("Run once"))
        });

        test("Registers result", async () => {
            const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            await adapter1.runOnce()
            const registers = await registerDataAccess.getAll()
            registersEqual(registers, mocks.mockRegisters)
        });

        test("runOptions:onlyFailedEntities", async () => {
            const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            await adapter1.runOnce()
            const adapter2 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            await adapter2.runOnce({ onlyFailedEntities: true })
            const registers = await registerDataAccess.getAll()
            const mockRegistersWithRetries = [
                ...mocks.mockRegisters,
                ...mocks.mockRegisters.filter(reg => reg.statusTag == RegisterStatusTag.failed)
            ]
            registersEqual(registers, mockRegistersWithRetries)
        })

        test("runOptions:mockEntities", async () => {
            const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            await adapter1.runOnce({ mockEntities: mocks.mockEntities })
            const registers = await registerDataAccess.getAll()
            registersEqual(registers, mocks.mockRegisters)
        })

    })
}

const statusEqual = (adapterStatus: AdapterStatus, mockStatus: AdapterStatus) => {
    expect(adapterStatus.id).not.toBeNull()
    expect(adapterStatus.syncContext.apdaterId).not.toBeNull()
    expect(adapterStatus.id).toEqual(adapterStatus.syncContext.apdaterId)
    adapterStatus.id = mockStatus.id
    adapterStatus.syncContext.apdaterId = mockStatus.id
    expect(adapterStatus).toEqual(mockStatus)
}

const registersEqual = (registers: Register<Entity>[], mockRegisters: Register<Entity>[]) => {
    expect(registers.length).toBe(mockRegisters.length)
    if (registers.length == mockRegisters.length)
        registers.forEach((register, index) => {
            registerEqual(register, mockRegisters[index])
        })
}

const registerEqual = (register: Register<Entity>, mockRegister: Register<Entity>) => {
    expect(register.id).not.toBeNull()
    expect(register.syncContext.apdaterId).not.toBeNull()
    expect(register.sourceAbsoluteId).not.toBeNull()
    expect(register.sourceRelativeId).not.toBeNull()
    register.id = mockRegister.id
    register.sourceAbsoluteId = mockRegister.sourceAbsoluteId
    register.sourceRelativeId = mockRegister.sourceRelativeId
    register.syncContext.apdaterId = mockRegister.syncContext.apdaterId
    expect(register).toEqual(mockRegister)
}


adapterTest(localAdapterExtractorDefinition, localAdapterExtractorMocks)