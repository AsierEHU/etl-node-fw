import EventEmitter from "events";
import { VolatileRegisterDataAccess } from "../../src/dataAccess/volatile";
import { AdapterFactory } from "../../src/interactors/adapters/factory";
import { InputEntity } from "../../src/interactors/adapters/processes/localAdapter/types";
import { AdapterDefinition, AdapterRunOptions } from "../../src/interactors/adapters/processes/types";
import { AdapterRunnerRunOptions, AdapterStatus, AdapterStatusTag } from "../../src/interactors/adapters/runners/types";
import { RegisterDataAccess, Register, SyncContext, RegisterStatusTag } from "../../src/interactors/registers/types";
import { getWithInitFormat, initRegisters, isByGroupSource, isOrigin, isByRowSource } from "../../src/interactors/registers/utils";
import { adapterMocksSuites } from "./mocks";


const adapterDefinitions: AdapterDefinition[] = [];
adapterMocksSuites.forEach(suite => {
    adapterDefinitions.push(suite.definition)
})
let adapterFactory: AdapterFactory
let adapterStatusCallback: any
let adapterErrorCallback: any
let registerDataAccess: RegisterDataAccess

let syncContext = {
    flowId: "testFlow",
    stepId: "testStep",
}
let defaultRunOptions: AdapterRunnerRunOptions = {
    syncContext
}

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
            const adapterPresenter = new EventEmitter()
            adapterStatusCallback = jest.fn(adapterStatus => {
                return adapterStatus
            })
            adapterPresenter.on("adapterStatus", adapterStatusCallback)
            adapterErrorCallback = jest.fn(adapterError => {
                return adapterError
            })
            adapterPresenter.on("adapterError", adapterErrorCallback)
            registerDataAccess = new VolatileRegisterDataAccess(mocks.mockInitialRegisters)
            const adapterDependencies = {
                adapterPresenter,
                registerDataAccess,
            }
            adapterFactory = new AdapterFactory(adapterDefinitions, adapterDependencies)
        });

        test("Presenter calls", async () => {
            const adapter1 = adapterFactory.createAdapterRunner(definition.id)
            const finalAdapterStatus = await adapter1.run(defaultRunOptions);
            statusEqual(finalAdapterStatus, mocks.mockFinalStatus)
            expect(adapterStatusCallback.mock.calls.length).toBe(3)
            statusEqual(adapterStatusCallback.mock.results[0].value, mocks.mockInitialStatus)
            statusEqual(adapterStatusCallback.mock.results[2].value, mocks.mockFinalStatus)
            if (finalAdapterStatus.statusTag == AdapterStatusTag.failed) {
                expect(adapterErrorCallback).toBeCalled()
            }
            else {
                expect(adapterErrorCallback).not.toBeCalled()
            }
        })

        test("Presenter calls: runOptions", async () => {
            const adapter1 = adapterFactory.createAdapterRunner(definition.id)
            const inputRunOptions: AdapterRunnerRunOptions = { ...defaultRunOptions, onlyFailedEntities: false, pushEntities: mocks.inputEntities }
            const outputRunOptions: AdapterRunOptions = { syncContext: defaultRunOptions.syncContext as SyncContext, onlyFailedEntities: false, usePushedEntities: true }
            const finalAdapterStatus = await adapter1.run(inputRunOptions);
            runOptionsEqual(finalAdapterStatus.runOptions as AdapterRunOptions, outputRunOptions)
            runOptionsEqual(adapterStatusCallback.mock.results[0].value.runOptions, outputRunOptions)
            runOptionsEqual(adapterStatusCallback.mock.results[2].value.runOptions, outputRunOptions)
        })

        //test statussummary
    })

    describe(definition.definitionType + " - " + definition.id + " registers test", () => {

        beforeEach(() => {
            const adapterPresenter = new EventEmitter()
            adapterStatusCallback = jest.fn(adapterStatus => {
                return adapterStatus
            })
            adapterPresenter.on("adapterStatus", adapterStatusCallback)
            registerDataAccess = new VolatileRegisterDataAccess(mocks.mockInitialRegisters)
            const adapterDependencies = {
                adapterPresenter,
                registerDataAccess,
            }
            adapterFactory = new AdapterFactory(adapterDefinitions, adapterDependencies)
        });

        test("Registers result", async () => {
            const adapter1 = adapterFactory.createAdapterRunner(definition.id)
            await adapter1.run(defaultRunOptions);
            const registers = await registerDataAccess.getAll()
            registersEqual(registers, mocks.mockFinalRegisters)
        });

        test("runOptions:onlyFailedEntities", async () => {
            const adapter1 = adapterFactory.createAdapterRunner(definition.id)
            await adapter1.run(defaultRunOptions);
            const adapter2 = adapterFactory.createAdapterRunner(definition.id)
            await adapter2.run({ ...defaultRunOptions, onlyFailedEntities: true });
            const registers = await registerDataAccess.getAll()
            const mockRegistersWithRetries = [
                ...mocks.mockFinalRegisters,
                ...mocks.mockFinalRegisters.filter(reg => reg.statusTag == RegisterStatusTag.failed && reg.entityType == definition.outputType)
            ]
            registersEqual(registers, mockRegistersWithRetries)
        })

        test("runOptions:pushEntities", async () => {
            const adapter1 = adapterFactory.createAdapterRunner(definition.id)
            await adapter1.run({ ...defaultRunOptions, pushEntities: mocks.inputEntities })
            const registers = await registerDataAccess.getAll()
            const entitiesWithMeta = getWithInitFormat(mocks.inputEntities)
            const pushedRegisters = initRegisters(entitiesWithMeta, syncContext)
            const registersWithMocks = [...mocks.mockInitialRegisters, ...pushedRegisters, ...mocks.mockNewRegisters]
            registersEqual(registers, registersWithMocks)
        })

        test("Not pending registers", async () => {
            const adapter1 = adapterFactory.createAdapterRunner(definition.id)
            await adapter1.run(defaultRunOptions)
            const registers = await registerDataAccess.getAll()
            registers.forEach(register => {
                expect(register.statusTag).not.toBe(RegisterStatusTag.pending)
            })
        })

        test("Relative and Absolute ids", async () => {
            const adapter1 = adapterFactory.createAdapterRunner(definition.id)
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
            const relativeRegister = await registerDataAccess.get(register.sourceRelativeId as string) as Register
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
            const relativeRegister = await registerDataAccess.get(register.sourceRelativeId as string) as Register
            expect(isOrigin(relativeRegister)).toBe(true)
        } else if (register.sourceRelativeId != register.sourceAbsoluteId) {
            expect(isOrigin(register)).toBe(false)
            const relativeRegister = await registerDataAccess.get(register.sourceRelativeId as string) as Register
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
    expect(adapterStatus.syncContext.adapterId).not.toBeNull()
    expect(adapterStatus.id).toEqual(adapterStatus.syncContext.adapterId)
    adapterStatus.id = mockStatus.id
    adapterStatus.syncContext.adapterId = mockStatus.syncContext.adapterId
    adapterStatus.runOptions = mockStatus.runOptions
    adapterStatus.timeFinished = mockStatus.timeFinished
    adapterStatus.timeStarted = mockStatus.timeStarted
    expect(adapterStatus).toEqual(mockStatus)
}

const runOptionsEqual = (runOtions: AdapterRunOptions, mockRunOptions: AdapterRunOptions) => {
    runOtions.syncContext.adapterId = mockRunOptions.syncContext.adapterId
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
    expect(register.syncContext.adapterId).not.toBeNull()
    expect(register.sourceAbsoluteId).not.toBeNull()
    expect(register.sourceRelativeId).not.toBeNull()
    register.id = mockFinalRegister.id
    register.sourceAbsoluteId = mockFinalRegister.sourceAbsoluteId
    register.sourceRelativeId = mockFinalRegister.sourceRelativeId
    register.syncContext.adapterId = mockFinalRegister.syncContext.adapterId
    expect(register).toEqual(mockFinalRegister)
}

adapterMocksSuites.forEach(suite => {
    adapterTest(suite.definition, suite.mocks)
})