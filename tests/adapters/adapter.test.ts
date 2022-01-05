import EventEmitter from "events";
import { VolatileRegisterDataAccess } from "../../src/dataAccess/volatile";
import { AdapterFactory } from "../../src/interactors/adapters/factory";
import { AdapterDefinition, AdapterRunOptions } from "../../src/interactors/adapters/processes/types";
import { AdapterStatus, AdapterStatusTag } from "../../src/interactors/adapters/runners/types";
import { RegisterDataAccess, Register, RegisterStatusTag, InputEntity, reservedRegisterEntityTypes } from "../../src/interactors/registers/types";
import { getWithInitFormat, initRegisters, isBySetSource, isOrigin, isByRowSource } from "../../src/interactors/registers/utils";
import { adapterMocks } from "./mocks";


const adapterDefinitions: AdapterDefinition[] = [];
adapterMocks.forEach(suite => {
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
let defaultRunOptions: AdapterRunOptions = {
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

    describe(definition.definitionType, () => {

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

        afterEach(async () => {

            //TEST Not pending registers
            const registers = await registerDataAccess.getAll()
            registers.forEach(register => {
                expect(register.statusTag).not.toBe(RegisterStatusTag.pending)
            })

            //TEST Relative and Absolute ids
            for (const register of registers) {
                await testSources(register, registerDataAccess);
            }
        })


        describe(definition.definitionType + " - " + definition.id + " status test", () => {

            test("Presenter calls", async () => {
                const adapter1 = adapterFactory.createAdapterRunner(definition.id)
                const finalAdapterStatus = await adapter1.run(syncContext, defaultRunOptions);
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

            test("Presenter calls runOptions", async () => {
                const adapter1 = adapterFactory.createAdapterRunner(definition.id)
                const runOptions: AdapterRunOptions = { ...defaultRunOptions, usePushedEntities: true, onlyFailedEntities: false }
                await adapter1.run(syncContext, runOptions);
                runOptionsEqual(adapterStatusCallback.mock.results[2].value.runOptions, runOptions)
            })
        })

        describe(definition.definitionType + " - " + definition.id + " registers test", () => {

            test("Registers result", async () => {
                const adapter1 = adapterFactory.createAdapterRunner(definition.id)
                await adapter1.run(syncContext, defaultRunOptions);
                const registers = await registerDataAccess.getAll()
                registersEqual(registers, mocks.mockFinalRegisters)
            });

            test("runOptions:onlyFailedEntities", async () => {
                const adapter1 = adapterFactory.createAdapterRunner(definition.id)
                await adapter1.run(syncContext, defaultRunOptions);
                const adapter2 = adapterFactory.createAdapterRunner(definition.id)
                await adapter2.run(syncContext, { ...defaultRunOptions, onlyFailedEntities: true });
                const registers = await registerDataAccess.getAll()
                const mockRegistersWithRetries = [
                    ...mocks.mockFinalRegisters,
                    ...mocks.mockFinalRegisters.filter(reg => reg.statusTag == RegisterStatusTag.failed && reg.entityType == definition.outputType)
                ]
                registersEqual(registers, mockRegistersWithRetries)
            })

            test("runOptions:usePushedEntities", async () => {
                const inputEntitiesWithMeta = getWithInitFormat(mocks.inputEntities, reservedRegisterEntityTypes.entityPushed)
                const inputRegisters = initRegisters(inputEntitiesWithMeta, { ...syncContext })
                await registerDataAccess.saveAll(inputRegisters)

                const adapter1 = adapterFactory.createAdapterRunner(definition.id)
                await adapter1.run(syncContext, { ...defaultRunOptions, usePushedEntities: true })
                const registers = await registerDataAccess.getAll()
                const entitiesWithMeta = getWithInitFormat(mocks.inputEntities, reservedRegisterEntityTypes.entityPushed)
                const pushedRegisters = initRegisters(entitiesWithMeta, syncContext)
                const registersWithMocks = [...mocks.mockInitialRegisters, ...pushedRegisters, ...mocks.mockNewRegisters]
                registersEqual(registers, registersWithMocks)
            })
        })
    })
}

export const testSources = async (register: Register, registerDataAccess: RegisterDataAccess) => {
    if (isBySetSource(register)) {
        if (register.id == register.sourceAbsoluteId && register.id == register.sourceRelativeId) {
            throw Error("Imposible case")
        }
        else if (register.sourceRelativeId == register.sourceAbsoluteId) {
            expect(isOrigin(register)).toBe(true)
        } else if (register.sourceRelativeId != register.sourceAbsoluteId) {
            expect(isOrigin(register)).toBe(false)
            const relativeRegister = await registerDataAccess.get(register.sourceRelativeId as string) as Register
            await testSources(relativeRegister, registerDataAccess)
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
            await testSources(relativeRegister, registerDataAccess)
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

const runOptionsEqual = (runOtions: AdapterRunOptions, mockRunOptions: AdapterRunOptions) => {
    expect(runOtions).toEqual(mockRunOptions)
}

adapterMocks.forEach(suite => {
    adapterTest(suite.definition, suite.mocks)
})