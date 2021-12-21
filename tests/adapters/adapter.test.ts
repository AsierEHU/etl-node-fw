import { EventEmitter } from "stream";
import { VolatileRegisterDataAccess } from "../../src/dataAccess/volatile";
import { AdapterFactory } from "../../src/interactors/adapters/factory";
import { AdapterDefinition, AdapterRunnerRunOptions, AdapterRunOptions, AdapterStatus, InputEntity } from "../../src/interactors/adapters/types";
import { Register, SyncContext, RegisterStatusTag } from "../../src/interactors/registers/types";
import { getWithInitFormat, initRegisters, isByGroupSource, isByRowSource, isOrigin } from "../../src/interactors/registers/utils";
import { adapterMocksSuites } from "./mocks";



let adapterPresenter = new EventEmitter()
let adapterDefinitions: AdapterDefinition[] = [];
adapterMocksSuites.forEach(suite => {
    adapterDefinitions.push(suite.definition)
})
let registerDataAccess = new VolatileRegisterDataAccess();
let adapterFactory = new AdapterFactory(adapterDefinitions)
let adapterDependencies = {
    adapterPresenter,
    registerDataAccess,
}
let syncContext = {
    flowId: "testFlow",
    stepId: "testStep",
}
let defaultRunOptions: AdapterRunnerRunOptions = {
    syncContext
}
let adapterPresenterCallback = jest.fn(adapterStatus => {
    return adapterStatus
})

const adapterTest = (
    definition: AdapterDefinition,
    mocks: {
        mockInitialStatus: AdapterStatus,
        mockFinalStatus: AdapterStatus,
        mockNewRegisters: Register[],
        mockFinalRegisters: Register[],
        mockInitialRegisters: Register[],
        inputEntities: InputEntity<any>[]
    }
) => {
    describe(definition.definitionType + " - " + definition.id + " status test", () => {

        beforeEach(() => {
            adapterPresenter.removeAllListeners("adapterStatus")
            adapterPresenterCallback = jest.fn(adapterStatus => {
                return adapterStatus
            })
            registerDataAccess = new VolatileRegisterDataAccess(mocks.mockInitialRegisters)
            adapterDependencies = {
                adapterPresenter,
                registerDataAccess,
            }
        });

        test("Presenter calls", async () => {
            adapterPresenter.on("adapterStatus", adapterPresenterCallback)
            const adapter1 = adapterFactory.createAdapterRunner(definition.id, adapterDependencies)
            const finalAdapterStatus = await adapter1.run(defaultRunOptions);
            statusEqual(finalAdapterStatus, mocks.mockFinalStatus)
            expect(adapterPresenterCallback.mock.calls.length).toBe(3)
            statusEqual(adapterPresenterCallback.mock.results[0].value, mocks.mockInitialStatus)
            statusEqual(adapterPresenterCallback.mock.results[2].value, mocks.mockFinalStatus)
        })

        test("Presenter calls: runOptions", async () => {
            adapterPresenter.on("adapterStatus", adapterPresenterCallback)
            const adapter1 = adapterFactory.createAdapterRunner(definition.id, adapterDependencies)
            const inputRunOptions: AdapterRunnerRunOptions = { ...defaultRunOptions, onlyFailedEntities: true, mockEntities: mocks.inputEntities }
            const outputRunOptions: AdapterRunOptions = { syncContext: defaultRunOptions.syncContext as SyncContext, onlyFailedEntities: true, useMockedEntities: true }
            const finalAdapterStatus = await adapter1.run(inputRunOptions);
            runOptionsEqual(finalAdapterStatus.runOptions as AdapterRunOptions, outputRunOptions)
            runOptionsEqual(adapterPresenterCallback.mock.results[0].value.runOptions, outputRunOptions)
            runOptionsEqual(adapterPresenterCallback.mock.results[2].value.runOptions, outputRunOptions)
        })

        //test statussummary
    })

    describe(definition.definitionType + " - " + definition.id + " registers test", () => {

        beforeEach(() => {
            adapterPresenter.removeAllListeners("adapterStatus")
            registerDataAccess = new VolatileRegisterDataAccess(mocks.mockInitialRegisters)
            adapterDependencies = {
                adapterPresenter,
                registerDataAccess,
            }
        });

        test("Registers result", async () => {
            const adapter1 = adapterFactory.createAdapterRunner(definition.id, adapterDependencies)
            await adapter1.run(defaultRunOptions);
            const registers = await registerDataAccess.getAll()
            registersEqual(registers, mocks.mockFinalRegisters)
        });

        test("runOptions:onlyFailedEntities", async () => {
            const adapter1 = adapterFactory.createAdapterRunner(definition.id, adapterDependencies)
            await adapter1.run(defaultRunOptions);
            const adapter2 = adapterFactory.createAdapterRunner(definition.id, adapterDependencies)
            await adapter2.run({ ...defaultRunOptions, onlyFailedEntities: true });
            const registers = await registerDataAccess.getAll()
            const mockRegistersWithRetries = [
                ...mocks.mockFinalRegisters,
                ...mocks.mockFinalRegisters.filter(reg => reg.statusTag == RegisterStatusTag.failed && reg.entityType == definition.outputType)
            ]
            registersEqual(registers, mockRegistersWithRetries)
        })

        test("runOptions:mockEntities", async () => {
            const adapter1 = adapterFactory.createAdapterRunner(definition.id, adapterDependencies)
            await adapter1.run({ ...defaultRunOptions, mockEntities: mocks.inputEntities })
            const registers = await registerDataAccess.getAll()
            const entitiesWithMeta = getWithInitFormat(mocks.inputEntities)
            const registersWithMocks = [...mocks.mockInitialRegisters, ...initRegisters(entitiesWithMeta, syncContext), ...mocks.mockNewRegisters]
            registersEqual(registers, registersWithMocks)
        })

        test("Not pending registers", async () => {
            const adapter1 = adapterFactory.createAdapterRunner(definition.id, adapterDependencies)
            await adapter1.run(defaultRunOptions)
            const registers = await registerDataAccess.getAll()
            registers.forEach(register => {
                expect(register.statusTag).not.toBe(RegisterStatusTag.pending)
            })
        })

        test("Relative and Absolute ids", async () => {
            const adapter1 = adapterFactory.createAdapterRunner(definition.id, adapterDependencies)
            await adapter1.run(defaultRunOptions)
            const registers = await registerDataAccess.getAll()
            for (const register of registers) {
                await testSources(register);
            }
        })
    })
}

const testSources = async (register: Register) => {
    if (isByGroupSource(register)) {
        if (register.id == register.sourceAbsoluteId && register.id == register.sourceRelativeId) {
            throw Error("Imposible case")
        }
        else if (register.sourceRelativeId == register.sourceAbsoluteId) {
            expect(isOrigin(register)).toBe(true)
        } else if (register.sourceRelativeId != register.sourceAbsoluteId) {
            expect(isOrigin(register)).toBe(false)
            const relativeRegister = await registerDataAccess.get(register.sourceRelativeId as string)
            await testSources(relativeRegister)
        }
        else {
            throw new Error("Unexpected case")
        }
    } else if (isByRowSource(register)) {
        if (register.id == register.sourceAbsoluteId && register.id == register.sourceRelativeId) {
            expect(isOrigin(register)).toBe(true)
        }
        else if (register.sourceRelativeId == register.sourceAbsoluteId) {
            expect(isOrigin(register)).toBe(false)
            const relativeRegister = await registerDataAccess.get(register.sourceRelativeId as string)
            expect(isOrigin(relativeRegister)).toBe(true)
        } else if (register.sourceRelativeId != register.sourceAbsoluteId) {
            expect(isOrigin(register)).toBe(false)
            const relativeRegister = await registerDataAccess.get(register.sourceRelativeId as string)
            await testSources(relativeRegister)
        }
        else {
            throw new Error("Unexpected case")
        }
    }
    else throw Error("Unexpected source")
}

const statusEqual = (adapterStatus: AdapterStatus, mockStatus: AdapterStatus) => {
    expect(adapterStatus.id).not.toBeNull()
    expect(adapterStatus.syncContext.apdaterId).not.toBeNull()
    expect(adapterStatus.id).toEqual(adapterStatus.syncContext.apdaterId)
    adapterStatus.id = mockStatus.id
    adapterStatus.syncContext.apdaterId = mockStatus.syncContext.apdaterId
    adapterStatus.runOptions = mockStatus.runOptions
    expect(adapterStatus).toEqual(mockStatus)
}

const runOptionsEqual = (runOtions: AdapterRunOptions, mockRunOptions: AdapterRunOptions) => {
    runOtions.syncContext.apdaterId = mockRunOptions.syncContext.apdaterId
    expect(runOtions).toEqual(mockRunOptions)
}

const registersEqual = (registers: Register[], mockFinalRegisters: Register[]) => {
    expect(registers.length).toBe(mockFinalRegisters.length)
    if (registers.length == mockFinalRegisters.length)
        registers.forEach((register, index) => {
            registerEqual(register, mockFinalRegisters[index])
        })
}

const registerEqual = (register: Register, mockFinalRegister: Register) => {
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

adapterMocksSuites.forEach(suite => {
    adapterTest(suite.definition, suite.mocks)
})