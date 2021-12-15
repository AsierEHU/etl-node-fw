import { EventEmitter } from "stream";
import { VolatileRegisterDataAccess } from "../../src/dataAccess/volatile";
import { AdapterFactory } from "../../src/interactors/adapters/factory";
import { AdapterDefinition, AdapterStatus, AdapterStatusSummary, InputEntity } from "../../src/interactors/adapters/types";
import { Entity, Register, SyncContext, RegisterStatusTag } from "../../src/interactors/registers/types";
import { localAdapterExtractorDefinition, localAdapterExtractorMocks } from "./localAdapterExtractorMocks"
import { localAdapterTransformerDefinition, localAdapterTransformerMocks } from "./localAdapterTransformerMocks";
import { localAdapterLoaderDefinition, localAdapterLoaderMocks } from "./localAdapterLoaderMocks";
import { localAdapterFlexDefinition, localAdapterFlexMocks } from "./localAdapterFlexMocks";


let adapterPresenter = new EventEmitter()
let adapterDefinitions = [localAdapterExtractorDefinition, localAdapterTransformerDefinition, localAdapterLoaderDefinition, localAdapterFlexDefinition];
let registerDataAccess = new VolatileRegisterDataAccess();
let adapterFactory = new AdapterFactory(adapterDefinitions)
let syncContext: SyncContext = {
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
        mockFinalRegisters: Register<Entity>[],
        mockInitialRegisters: Register<Entity>[],
        mockEntities: InputEntity<Entity>[]
    }
) => {
    describe(definition.definitionType, () => {

        beforeEach(() => {
            adapterPresenter.removeAllListeners("adapterStatus")
            registerDataAccess = new VolatileRegisterDataAccess(mocks.mockInitialRegisters)
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
            registersEqual(registers, mocks.mockFinalRegisters)
        });

        test("runOptions:onlyFailedEntities", async () => {
            const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            await adapter1.runOnce()
            const adapter2 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            await adapter2.runOnce({ onlyFailedEntities: true })
            const registers = await registerDataAccess.getAll()
            const mockRegistersWithRetries = [
                ...mocks.mockFinalRegisters,
                ...mocks.mockFinalRegisters.filter(reg => reg.statusTag == RegisterStatusTag.failed && reg.entityType == definition.outputType)
            ]
            registersEqual(registers, mockRegistersWithRetries)
        })

        test("runOptions:mockEntities", async () => {
            const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            await adapter1.runOnce({ mockEntities: mocks.mockEntities })
            const registers = await registerDataAccess.getAll()
            registersEqual(registers, mocks.mockFinalRegisters)
        })

        //final status with inputOptions

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

const registersEqual = (registers: Register<Entity>[], mockFinalRegisters: Register<Entity>[]) => {
    expect(registers.length).toBe(mockFinalRegisters.length)
    if (registers.length == mockFinalRegisters.length)
        registers.forEach((register, index) => {
            registerEqual(register, mockFinalRegisters[index])
        })
}

const registerEqual = (register: Register<Entity>, mockFinalRegister: Register<Entity>) => {
    expect(register.id).not.toBeNull()
    expect(register.syncContext.apdaterId).not.toBeNull()
    expect(register.sourceAbsoluteId).not.toBeNull()
    expect(register.sourceRelativeId).not.toBeNull()
    register.id = mockFinalRegister.id
    register.sourceAbsoluteId = mockFinalRegister.sourceAbsoluteId
    register.sourceRelativeId = mockFinalRegister.sourceRelativeId
    register.syncContext.apdaterId = mockFinalRegister.syncContext.apdaterId
    expect(register).toEqual(mockFinalRegister)
}


adapterTest(localAdapterExtractorDefinition, localAdapterExtractorMocks)
adapterTest(localAdapterTransformerDefinition, localAdapterTransformerMocks)
adapterTest(localAdapterLoaderDefinition, localAdapterLoaderMocks)
adapterTest(localAdapterFlexDefinition, localAdapterFlexMocks)