import { EventEmitter } from "stream";
import { VolatileRegisterDataAccess } from "../../src/dataAccess/volatile";
import { AdapterFactory } from "../../src/interactors/adapters/factory";
import { AdapterDefinition, AdapterStatus, InputEntity } from "../../src/interactors/adapters/types";
import { Entity, Register, SyncContext, RegisterStatusTag } from "../../src/interactors/registers/types";
import { isByGroupSource, isByRowSource, isOrigin } from "../../src/interactors/registers/utils";
import { adapterMocksSuites } from "./mocks";



let adapterPresenter = new EventEmitter()
let adapterDefinitions: AdapterDefinition[] = [];
adapterMocksSuites.forEach(suite => {
    adapterDefinitions.push(suite.definition)
})
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

let adapterPresenterCallback = jest.fn(adapterStatus => {
    return adapterStatus
})

const adapterTest = (
    definition: AdapterDefinition,
    mocks: {
        mockInitialStatus: AdapterStatus,
        mockFinalStatus: AdapterStatus,
        mockNewRegisters: Register<Entity>[],
        mockFinalRegisters: Register<Entity>[],
        mockInitialRegisters: Register<Entity>[],
        inputEntities: InputEntity<Entity>[]
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
                syncContext,
            }
        });

        test("Initial status", async () => {
            const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            const adapterStatus = await adapter1.getStatus();
            statusEqual(adapterStatus, mocks.mockInitialStatus)
        })

        test("Final status", async () => {
            const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            try {
                await adapter1.runOnce();
                const adapterStatus = await adapter1.getStatus()
                statusEqual(adapterStatus, mocks.mockFinalStatus)
            } catch (error: any) {
                expect(error.message).toBe("Test custom Error")
            }

        })

        test("Presenter calls", async () => {
            adapterPresenter.on("adapterStatus", adapterPresenterCallback)
            const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            try {
                await adapter1.runOnce();
                expect(adapterPresenterCallback.mock.calls.length).toBe(3)
                statusEqual(adapterPresenterCallback.mock.results[0].value, mocks.mockInitialStatus)
                statusEqual(adapterPresenterCallback.mock.results[2].value, mocks.mockFinalStatus)
            } catch (error: any) {
                expect(error.message).toBe("Test custom Error")
            }
        })

        test("Final status: runOptions", async () => {
            const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            const runOptions = { onlyFailedEntities: true, inputEntities: mocks.inputEntities }
            try {
                await adapter1.runOnce(runOptions);
                const adapterStatus = await adapter1.getStatus()
                expect(adapterStatus.runOptions).toEqual(runOptions)
            } catch (error: any) {
                expect(error.message).toBe("Test custom Error")
            }
        })

        test("Presenter calls: runOptions", async () => {
            adapterPresenter.on("adapterStatus", adapterPresenterCallback)
            const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            const runOptions = { onlyFailedEntities: true, inputEntities: mocks.inputEntities }
            try {
                await adapter1.runOnce(runOptions);
                expect(adapterPresenterCallback.mock.results[0].value.runOptions).toBe(null)
                expect(adapterPresenterCallback.mock.results[2].value.runOptions).toEqual(runOptions)
            } catch (error: any) {
                expect(error.message).toBe("Test custom Error")
            }
        })

        test("Run once exception", async () => {
            const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            try {
                await adapter1.runOnce();
                await expect(adapter1.runOnce()).rejects.toEqual(new Error("Run once"))
            } catch (error: any) {
                expect(error.message).toBe("Test custom Error")
            }
        });

    })

    describe(definition.definitionType + " - " + definition.id + " registers test", () => {

        beforeEach(() => {
            adapterPresenter.removeAllListeners("adapterStatus")
            registerDataAccess = new VolatileRegisterDataAccess(mocks.mockInitialRegisters)
            adapterDependencies = {
                adapterPresenter,
                registerDataAccess,
                syncContext,
            }
        });

        test("Registers result", async () => {
            const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            try {
                await adapter1.runOnce();
                const registers = await registerDataAccess.getAll()
                registersEqual(registers, mocks.mockFinalRegisters)
            } catch (error: any) {
                expect(error.message).toBe("Test custom Error")
            }
        });

        test("runOptions:onlyFailedEntities", async () => {
            const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            try {
                await adapter1.runOnce();
            } catch (error: any) {
                expect(error.message).toBe("Test custom Error")
            }
            const adapter2 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            try {
                await adapter2.runOnce({ onlyFailedEntities: true });
                const registers = await registerDataAccess.getAll()
                const mockRegistersWithRetries = [
                    ...mocks.mockFinalRegisters,
                    ...mocks.mockFinalRegisters.filter(reg => reg.statusTag == RegisterStatusTag.failed && reg.entityType == definition.outputType)
                ]
                registersEqual(registers, mockRegistersWithRetries)
            } catch (error: any) {
                expect(error.message).toBe("Test custom Error")
            }
        })

        test("runOptions:inputEntities", async () => {
            const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            try {
                await adapter1.runOnce({ inputEntities: mocks.inputEntities })
                const registers = await registerDataAccess.getAll()
                registersEqual(registers, mocks.mockFinalRegisters)
            } catch (error: any) {
                expect(error.message).toBe("Test custom Error")
            }
        })

        test("Not pending registers", async () => {
            const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            try {
                await adapter1.runOnce()
                const registers = await registerDataAccess.getAll()
                registers.forEach(register => {
                    expect(register.statusTag).not.toBe(RegisterStatusTag.pending)
                })
            } catch (error: any) {
                expect(error.message).toBe("Test custom Error")
            }
        })

        test("Relative and Absolute ids", async () => {
            const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            try {
                await adapter1.runOnce()
                const registers = await registerDataAccess.getAll()
                for (const register of registers) {
                    await testSources(register);
                }
            } catch (error: any) {
                expect(error.message).toBe("Test custom Error")
            }
        })
    })
}

const testSources = async (register: Register<Entity>) => {
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

adapterMocksSuites.forEach(suite => {
    adapterTest(suite.definition, suite.mocks)
})