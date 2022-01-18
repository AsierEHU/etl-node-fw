import { EventEmitter } from "stream";
import { AdapterFactory, RegisterDataAccess, StepDefinition, StepFactory, StepStatus, AdapterRunOptions, VolatileRegisterDataAccess, StepStatusTag, StepRunOptions, AdapterDefinition, VolatileProcessStatusDataAccess } from "../../src";
import { StatusTag } from "../../src/business/processStatus";
import { SyncContext, RegisterStatusTag } from "../../src/business/register";
import { ProcessStatusDataAccess } from "../../src/interactors/common/processes";
import { testSources } from "../adapters/adapter.test";
import { stepMocks } from "./mocks";

let adapterFactory: AdapterFactory
let adapterStatusCallback: any
let registerDataAccess: RegisterDataAccess
let processStatusDataAccess: ProcessStatusDataAccess

const stepDefinitions: StepDefinition[] = [];
stepMocks.forEach(suite => {
    stepDefinitions.push(suite.definition)
})
let stepFactory: StepFactory
let stepStatusCallback: any
let stepErrorCallback: any

const syncContext: SyncContext = {
    flowId: "testFlow",
}
let defaultRunOptions: {}


const stepTest = (
    definition: StepDefinition,
    mocks: {
        mockInitialStatus: StepStatus,
        mockFinalStatus: StepStatus,
        mockAdapterRunOptions: AdapterRunOptions,
        adapterDefinitions: AdapterDefinition[]
    }
) => {

    describe(definition.definitionType + " - " + definition.id, () => {

        beforeEach(() => {
            const presenter = new EventEmitter()
            stepStatusCallback = jest.fn(stepStatus => {
                return stepStatus
            })
            stepErrorCallback = jest.fn(stepError => {
                return stepError
            })
            adapterStatusCallback = jest.fn(adapterStatus => {
                return adapterStatus
            })
            presenter.on("adapterStatus", adapterStatusCallback)
            presenter.on("stepStatus", stepStatusCallback)
            presenter.on("stepError", stepErrorCallback)
            registerDataAccess = new VolatileRegisterDataAccess()
            processStatusDataAccess = new VolatileProcessStatusDataAccess()
            const adapterDependencies = {
                adapterPresenter: presenter,
                registerDataAccess,
                processStatusDataAccess
            }
            adapterFactory = new AdapterFactory(mocks.adapterDefinitions, adapterDependencies)
            const stepDependencies = {
                stepPresenter: presenter,
                registerDataAccess,
                processStatusDataAccess,
                adapterFactory,
            }
            stepFactory = new StepFactory(stepDefinitions, stepDependencies)
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

            test("Presenter calls", async () => {
                const step1 = stepFactory.createStepRunner(definition.id)
                const finalStepStatus = await step1.run(syncContext, defaultRunOptions);
                statusEqual(finalStepStatus, mocks.mockFinalStatus)
                expect(stepStatusCallback.mock.calls.length).toBe(3)
                statusEqual(stepStatusCallback.mock.results[0].value, mocks.mockInitialStatus)
                statusEqual(stepStatusCallback.mock.results[2].value, mocks.mockFinalStatus)
                if (finalStepStatus.statusTag == StatusTag.failed) {
                    expect(stepErrorCallback).toBeCalled()
                }
                else {
                    expect(stepErrorCallback).not.toBeCalled()
                }
            })

            test("Presenter calls runOptions", async () => {
                const step1 = stepFactory.createStepRunner(definition.id)
                const runOptions: StepRunOptions = { ...defaultRunOptions, pushEntities: {} }
                await step1.run(syncContext, runOptions);
                const adapterRunOptions: AdapterRunOptions = { ...mocks.mockAdapterRunOptions, usePushedEntityTypes: [] }
                runOptionsEqual(adapterStatusCallback.mock.results[2].value.runOptions, adapterRunOptions)
            })

        })

        describe("Registers test", () => {

            test("runOptions:pushEntities", async () => {
                const entityInputPushed = { msg: "Push entities test" }
                const entityPushedType = "testInput"
                const step1 = stepFactory.createStepRunner(definition.id)
                const runOptions: StepRunOptions = { ...defaultRunOptions, pushEntities: { [entityPushedType]: [entityInputPushed] } }
                await step1.run(syncContext, runOptions);
                const registerInputPushed = await registerDataAccess.getAll({ entityType: entityPushedType })
                expect(registerInputPushed[0].entity).toEqual(entityInputPushed)
            })

        })

    })

}

const statusEqual = (stepStatus: StepStatus, mockStatus: StepStatus) => {
    expect(stepStatus.id).not.toBeNull()
    expect(stepStatus.syncContext.stepId).not.toBeNull()
    expect(stepStatus.id).toEqual(stepStatus.syncContext.stepId)
    stepStatus.id = mockStatus.id
    stepStatus.syncContext.stepId = mockStatus.id
    stepStatus.timeFinished = mockStatus.timeFinished
    stepStatus.timeStarted = mockStatus.timeStarted
    expect(stepStatus).toEqual(mockStatus)
}

const runOptionsEqual = (runOtions: AdapterRunOptions, mockRunOptions: AdapterRunOptions) => {
    expect(runOtions).toEqual(mockRunOptions)
}

stepMocks.forEach(suite => {
    stepTest(suite.definition, suite.mocks)
})

