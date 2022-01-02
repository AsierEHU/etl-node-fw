import { EventEmitter } from "stream";
import { VolatileRegisterDataAccess } from "../../src/dataAccess/volatile";
import { AdapterFactory } from "../../src/interactors/adapters/factory";
import { AdapterRunOptions } from "../../src/interactors/adapters/processes/types";
import { RegisterDataAccess, RegisterStatusTag, SyncContext } from "../../src/interactors/registers/types";
import { StepFactory } from "../../src/interactors/steps/factory";
import { StepDefinition, StepRunOptions } from "../../src/interactors/steps/processes/types";
import { StepStatus, StepStatusTag } from "../../src/interactors/steps/runners/types";
import { testSources } from "../adapters/adapter.test";
import { case1Definition } from "../adapters/localAdapterExtractorMocks/case1Mocks";
import { stepMocks } from "./mocks";

const adapterDefinitions = [case1Definition];
let adapterFactory: AdapterFactory
let adapterStatusCallback: any
let registerDataAccess: RegisterDataAccess

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
        mockAdapterRunOptions: AdapterRunOptions
    }
) => {

    describe(definition.definitionType, () => {

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
            const adapterDependencies = {
                adapterPresenter: presenter,
                registerDataAccess,
            }
            adapterFactory = new AdapterFactory(adapterDefinitions, adapterDependencies)
            const stepDependencies = {
                stepPresenter: presenter,
                registerDataAccess: registerDataAccess,
                adapterFactory
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


        describe(definition.definitionType + " - " + definition.id + " status test", () => {

            test("Presenter calls", async () => {
                const step1 = stepFactory.createStepRunner(definition.id)
                const finalStepStatus = await step1.run(syncContext, defaultRunOptions);
                statusEqual(finalStepStatus, mocks.mockFinalStatus)
                expect(stepStatusCallback.mock.calls.length).toBe(3)
                statusEqual(stepStatusCallback.mock.results[0].value, mocks.mockInitialStatus)
                statusEqual(stepStatusCallback.mock.results[2].value, mocks.mockFinalStatus)
                if (finalStepStatus.statusTag == StepStatusTag.failed) {
                    expect(stepErrorCallback).toBeCalled()
                }
                else {
                    expect(stepErrorCallback).not.toBeCalled()
                }
            })

            test("Presenter calls runOptions", async () => {
                const step1 = stepFactory.createStepRunner(definition.id)
                const runOptions: StepRunOptions = { ...defaultRunOptions, pushEntities: [] }
                await step1.run(syncContext, runOptions);
                const adapterRunOptions: AdapterRunOptions = { ...mocks.mockAdapterRunOptions, usePushedEntities: true }
                runOptionsEqual(adapterStatusCallback.mock.results[2].value.runOptions, adapterRunOptions)
            })

        })

        describe(definition.definitionType + " - " + definition.id + " registers test", () => {

            test("runOptions:pushEntities", async () => {
                const entityInputPushed = { msg: "Push entities test" }
                const step1 = stepFactory.createStepRunner(definition.id)
                const runOptions: StepRunOptions = { ...defaultRunOptions, pushEntities: [entityInputPushed] }
                await step1.run(syncContext, runOptions);
                const registerInputPushed = await registerDataAccess.getAll({ registerType: "$inputPushed" })
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

