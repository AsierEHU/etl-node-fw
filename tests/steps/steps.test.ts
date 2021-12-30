import { EventEmitter } from "stream";
import { VolatileRegisterDataAccess } from "../../src/dataAccess/volatile";
import { AdapterFactory } from "../../src/interactors/adapters/factory";
import { AdapterRunOptions } from "../../src/interactors/adapters/processes/types";
import { AdapterRunnerRunOptions } from "../../src/interactors/adapters/runners/types";
import { RegisterDataAccess, SyncContext } from "../../src/interactors/registers/types";
import { StepFactory } from "../../src/interactors/steps/factory";
import { StepDefinition } from "../../src/interactors/steps/processes/types";
import { StepStatus } from "../../src/interactors/steps/runners/types";
import { case1Definition } from "../adapters/localAdapterExtractorMocks/case1Mocks";
import { stepMocksSuites } from "./mocks";

const adapterDefinitions = [case1Definition];
let adapterFactory: AdapterFactory
let adapterPresenterCallback: any
let registerDataAccess: RegisterDataAccess

const stepDefinitions: StepDefinition[] = [];
stepMocksSuites.forEach(suite => {
    stepDefinitions.push(suite.definition)
})
let stepFactory: StepFactory
let stepPresenterCallback: any

const syncContext: SyncContext = {
    flowId: "testFlow",
}
let defaultRunOptions: AdapterRunnerRunOptions = {
    syncContext
}


const stepTest = (
    definition: StepDefinition,
    mocks: {
        mockInitialStatus: StepStatus,
        mockFinalStatus: StepStatus,
        mockAdapterRunOptions: AdapterRunOptions
    }
) => {
    describe(definition.definitionType + " - " + definition.id + " status test", () => {

        beforeEach(() => {
            const presenter = new EventEmitter()
            stepPresenterCallback = jest.fn(stepStatus => {
                return stepStatus
            })
            adapterPresenterCallback = jest.fn(adapterStatus => {
                return adapterStatus
            })
            presenter.on("adapterStatus", adapterPresenterCallback)
            presenter.on("stepStatus", stepPresenterCallback)
            registerDataAccess = new VolatileRegisterDataAccess()
            const adapterDependencies = {
                adapterPresenter: presenter,
                registerDataAccess,
            }
            adapterFactory = new AdapterFactory(adapterDefinitions, adapterDependencies)
            const stepDependencies = {
                stepPresenter: presenter,
                adapterFactory
            }
            stepFactory = new StepFactory(stepDefinitions, stepDependencies)
        });

        test("Presenter calls", async () => {
            const step1 = stepFactory.createStepRunner(definition.id)
            const finalStepStatus = await step1.run(defaultRunOptions);
            statusEqual(finalStepStatus, mocks.mockFinalStatus)
            expect(stepPresenterCallback.mock.calls.length).toBe(3)
            statusEqual(stepPresenterCallback.mock.results[0].value, mocks.mockInitialStatus)
            statusEqual(stepPresenterCallback.mock.results[2].value, mocks.mockFinalStatus)
        })

        test("Adapter run options", async () => {
            const step1 = stepFactory.createStepRunner(definition.id)
            await step1.run(defaultRunOptions);
            runOptionsEqual(adapterPresenterCallback.mock.results[2].value.runOptions, mocks.mockAdapterRunOptions)
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
    runOtions.syncContext.adapterId = mockRunOptions.syncContext.adapterId
    runOtions.syncContext.stepId = mockRunOptions.syncContext.stepId
    expect(runOtions).toEqual(mockRunOptions)
}

stepMocksSuites.forEach(suite => {
    stepTest(suite.definition, suite.mocks)
})

