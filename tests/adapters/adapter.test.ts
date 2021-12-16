import { EventEmitter } from "stream";
import { VolatileRegisterDataAccess } from "../../src/dataAccess/volatile";
import { AdapterFactory } from "../../src/interactors/adapters/factory";
import { AdapterDefinition, AdapterStatus, AdapterStatusSummary, InputEntity } from "../../src/interactors/adapters/types";
import { Entity, Register, SyncContext, RegisterStatusTag } from "../../src/interactors/registers/types";
import { localAdapterExtractorMocksSuite } from "./localAdapterExtractorMocks"
import { localAdapterTransformerMocksSuite } from "./localAdapterTranformerMocks";
import { isByGroupSource, isByRowSource, isOrigin } from "../../src/interactors/registers/utils";


let adapterPresenter = new EventEmitter()
let adapterDefinitions: AdapterDefinition[] = [];
localAdapterExtractorMocksSuite.forEach(suite => {
    adapterDefinitions.push(suite.definition)
})
localAdapterTransformerMocksSuite.forEach(suite => {
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

const adapterTest = (
    definition: AdapterDefinition,
    mocks: {
        mockInitialStatus: AdapterStatus,
        mockFinalStatus: AdapterStatus,
        mockFinalSummary: AdapterStatusSummary,
        mockNewRegisters: Register<Entity>[],
        mockFinalRegisters: Register<Entity>[],
        mockInitialRegisters: Register<Entity>[],
        inputEntities: InputEntity<Entity>[]
    }
) => {
    describe(definition.definitionType + " - " + definition.id + " status test", () => {

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
            try {
                const adapterStatusSummary = await adapter1.runOnce();
                expect(adapterStatusSummary).toEqual(mocks.mockFinalSummary)
            } catch (error: any) {
                expect(error.message).toBe("My custom run error")
            }
        })

        test("Final status", async () => {
            const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            try {
                await adapter1.runOnce();
                const adapterStatus = await adapter1.getStatus()
                statusEqual(adapterStatus, mocks.mockFinalStatus)
            } catch (error: any) {
                expect(error.message).toBe("My custom run error")
            }

        })

        test("Final presenter", (done) => {
            const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            adapterPresenter.on("adapterStatus", (adapterStatus) => {
                statusEqual(adapterStatus, mocks.mockFinalStatus)
                done()
            })
            adapter1.runOnce().catch(error => {
                expect(error.message).toBe("My custom run error")
                done()
            })
        })

        test("Final status: runOptions", async () => {
            const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            const runOptions = { onlyFailedEntities: true, inputEntities: mocks.inputEntities }
            try {
                await adapter1.runOnce(runOptions);
                const adapterStatus = await adapter1.getStatus()
                expect(adapterStatus.runOptions).toEqual(runOptions)
            } catch (error: any) {
                expect(error.message).toBe("My custom run error")
            }
        })

        test("Final presenter: runOptions", (done) => {
            const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            const runOptions = { onlyFailedEntities: true, inputEntities: mocks.inputEntities }
            adapterPresenter.on("adapterStatus", (adapterStatus) => {
                expect(adapterStatus.runOptions).toEqual(runOptions)
                done()
            })
            adapter1.runOnce(runOptions).catch(error => {
                expect(error.message).toBe("My custom run error")
                done()
            })
        })

        test("Run once exception", async () => {
            const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            try {
                await adapter1.runOnce();
                await expect(adapter1.runOnce()).rejects.toEqual(new Error("Run once"))
            } catch (error: any) {
                expect(error.message).toBe("My custom run error")
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
                expect(error.message).toBe("My custom run error")
            }
        });

        test("runOptions:onlyFailedEntities", async () => {
            const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            try {
                await adapter1.runOnce();
            } catch (error: any) {
                expect(error.message).toBe("My custom run error")
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
                expect(error.message).toBe("My custom run error")
            }
        })

        test("runOptions:inputEntities", async () => {
            const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
            try {
                await adapter1.runOnce({ inputEntities: mocks.inputEntities })
                const registers = await registerDataAccess.getAll()
                registersEqual(registers, mocks.mockFinalRegisters)
            } catch (error: any) {
                expect(error.message).toBe("My custom run error")
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
                expect(error.message).toBe("My custom run error")
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
                expect(error.message).toBe("My custom run error")
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

localAdapterExtractorMocksSuite.forEach(suite => {
    adapterTest(suite.definition, suite.mocks)
})
localAdapterTransformerMocksSuite.forEach(suite => {
    adapterTest(suite.definition, suite.mocks)
})