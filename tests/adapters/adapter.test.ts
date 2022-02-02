import EventEmitter from "events";
import { cloneDeep } from "lodash";
import { AdapterDefinition, AdapterFactory, AdapterRunOptions, AdapterPresenter, VolatileRegisterDataAccess, RegisterDataAccess, VolatileProcessStatusDataAccess } from "../../src";
import { ProcessStatus, StatusTag } from "../../src/business/processStatus";
import { AdapterSpecialIds, Register, RegisterStatusTag, ReservedEntityTypes } from "../../src/business/register";
import { getWithInitFormat } from "../../src/interactors/adapters/processes/localAdapter/utils";
import { ProcessStatusDataAccess } from "../../src/interactors/common/processes";
import { initRegisters, isOrigin } from "../../src/interactors/registers/utils";
import { adapterMocks } from "./mocks";


const adapterDefinitions: AdapterDefinition[] = [];
adapterMocks.forEach(suite => {
    adapterDefinitions.push(suite.definition)
})
let adapterFactory: AdapterFactory
let adapterStatusCallback: any
let adapterErrorCallback: any
let registerDataAccess: RegisterDataAccess
let processStatusDataAccess: ProcessStatusDataAccess

let syncContext = {
    flowId: "testFlow",
    stepId: "testStep",
}
let defaultRunOptions: AdapterRunOptions = {
}

const adapterTest = (
    definition: AdapterDefinition,
    mocks: {
        mockInitialStatus: ProcessStatus,
        mockFinalStatus: ProcessStatus,
        mockInitialPresenter: AdapterPresenter,
        mockFinalPresenter: AdapterPresenter,
        mockNewRegisters: Register[],
        mockFinalRegisters: Register[],
        mockInitialRegisters: Register[],
        inputEntities: { [type: string]: any[] }
    }
) => {

    describe(definition.definitionType + " - " + definition.id, () => {

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
            processStatusDataAccess = new VolatileProcessStatusDataAccess()
            const adapterDependencies = {
                adapterPresenter,
                registerDataAccess,
                processStatusDataAccess
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


        describe("Status test", () => {

            test("Process status", async () => {
                const adapter1 = adapterFactory.createAdapterRunner(definition.id)
                await adapter1.run(syncContext, defaultRunOptions);
                const finalAdapterStatus = (await processStatusDataAccess.getAll())[0]
                statusEqual(finalAdapterStatus, mocks.mockFinalStatus)
            })
        })

        describe("Presenter test", () => {

            test("Presenter calls", async () => {
                const adapter1 = adapterFactory.createAdapterRunner(definition.id)
                const finalAdapterStatus = await adapter1.run(syncContext, defaultRunOptions);
                presentersEqual(finalAdapterStatus, mocks.mockFinalPresenter)
                expect(adapterStatusCallback.mock.calls.length).toBe(3)
                presentersEqual(adapterStatusCallback.mock.results[0].value, mocks.mockInitialPresenter)
                presentersEqual(adapterStatusCallback.mock.results[2].value, mocks.mockFinalPresenter)
                if (finalAdapterStatus.statusTag == StatusTag.failed) {
                    expect(adapterErrorCallback).toBeCalled()
                }
                else {
                    expect(adapterErrorCallback).not.toBeCalled()
                }
            })

            test("Presenter calls runOptions", async () => {
                const adapter1 = adapterFactory.createAdapterRunner(definition.id)
                const runOptions: AdapterRunOptions = { ...defaultRunOptions, usePushedEntityTypes: ["testType"], onlyFailedEntities: false }
                await adapter1.run(syncContext, runOptions);
                runOptionsEqual(adapterStatusCallback.mock.results[2].value.runOptions, runOptions)
            })
        })

        describe("Registers test", () => {

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
                const registersWithoutSpecials = registers.filter(reg => reg.entityType !== ReservedEntityTypes.setRegister)
                const mockRegistersWithRetries = [
                    ...mocks.mockFinalRegisters,
                    ...mocks.mockFinalRegisters.filter(reg => reg.statusTag == RegisterStatusTag.failed && reg.entityType == definition.outputType)
                ].filter(reg => reg.entityType !== ReservedEntityTypes.setRegister)
                registersEqual(registersWithoutSpecials, mockRegistersWithRetries)
            })

            test("runOptions:usePushedEntityTypes", async () => {
                const entityTypes = Object.keys(mocks.inputEntities);
                let pushedRegisters: Register[] = []
                for (const entityType of entityTypes) {
                    const inputEntitiesWithMeta = getWithInitFormat(mocks.inputEntities[entityType], entityType, definition.id)
                    const inputRegisters = initRegisters(inputEntitiesWithMeta, {
                        stepId: syncContext.stepId,
                        flowId: syncContext.flowId,
                        adapterId: AdapterSpecialIds.pushEntity
                    })
                    await registerDataAccess.saveAll(inputRegisters)
                    pushedRegisters = [...pushedRegisters, ...inputRegisters]
                }

                const adapter1 = adapterFactory.createAdapterRunner(definition.id)
                await adapter1.run(syncContext, { ...defaultRunOptions, usePushedEntityTypes: entityTypes })
                const registers = await registerDataAccess.getAll()

                const registersWithMocks = [...mocks.mockInitialRegisters, ...pushedRegisters, ...mocks.mockNewRegisters]
                registersEqual(registers, registersWithMocks)
            })
        })
    })
}

export const testSources = async (register: Register, registerDataAccess: RegisterDataAccess) => {

    if (register.entityType === ReservedEntityTypes.setRegister) {
        expect(isOrigin(register)).toBe(false)
        const registersInSetIds = register.entity as string[]
        const registersInSet = await registerDataAccess.getAll({ registersIds: registersInSetIds })
        if (!registersInSet.length) {
            throw new Error("Origin not found, set register is empty")
        }
        for (const relativeRegister of registersInSet) {
            await testSources(relativeRegister, registerDataAccess)
        }
    } else {
        if (register.id === register.sourceAbsoluteId && register.id === register.sourceRelativeId) {
            expect(isOrigin(register)).toBe(true)
        } else {
            expect(isOrigin(register)).toBe(false)
            const relativeRegister = await registerDataAccess.get(register.sourceRelativeId as string)
            if (!relativeRegister)
                throw new Error("Origin not found, relative register not found")
            await testSources(relativeRegister, registerDataAccess)
        }
    }
}

const statusEqual = (adapterStatus: ProcessStatus, mockStatus: ProcessStatus) => {
    adapterStatus = cloneDeep(adapterStatus)
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


const presentersEqual = (adapterStatus: AdapterPresenter, mockStatus: AdapterPresenter) => {
    adapterStatus = cloneDeep(adapterStatus)
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
            const mockRegister = mockFinalRegisters[index]
            registerEqual(register, mockRegister)
        })
}

const registerEqual = (register: Register, mockFinalRegister: Register) => {
    register = cloneDeep(register)
    expect(register.id).not.toBeNull()
    expect(register.syncContext.adapterId).not.toBeNull()
    expect(register.sourceAbsoluteId).not.toBeNull()
    expect(register.sourceRelativeId).not.toBeNull()
    expect(register.date).not.toBeNull()
    register.date = mockFinalRegister.date
    register.id = mockFinalRegister.id
    register.sourceAbsoluteId = mockFinalRegister.sourceAbsoluteId
    register.sourceRelativeId = mockFinalRegister.sourceRelativeId
    register.syncContext.adapterId = mockFinalRegister.syncContext.adapterId

    expect(register.entityType).toEqual(mockFinalRegister.entityType)
    if (register.entityType === ReservedEntityTypes.setRegister) {
        register.entity = mockFinalRegister.entity
    }

    expect(register).toEqual(mockFinalRegister)
}

const runOptionsEqual = (runOtions: AdapterRunOptions, mockRunOptions: AdapterRunOptions) => {
    expect(runOtions).toEqual(mockRunOptions)
}

adapterMocks.forEach(suite => {
    adapterTest(suite.definition, suite.mocks)
})