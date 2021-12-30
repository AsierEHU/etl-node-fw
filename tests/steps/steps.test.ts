import { EventEmitter } from "stream";
import { VolatileRegisterDataAccess } from "../../src/dataAccess/volatile";
import { AdapterFactory } from "../../src/interactors/adapters/factory";
import { AdapterRunOptions } from "../../src/interactors/adapters/processes/types";
import { AdapterRunnerRunOptions } from "../../src/interactors/adapters/runners/types";
import { RegisterDataAccess, SyncContext } from "../../src/interactors/registers/types";
import { StepFactory } from "../../src/interactors/steps/factory";
import { StepDefinition } from "../../src/interactors/steps/processes/types";
import { StepStatus, StepStatusTag } from "../../src/interactors/steps/runners/types";
import { case1Definition } from "../adapters/localAdapterExtractorMocks/case1Mocks";
import { stepMocksSuites } from "./mocks";

const adapterDefinitions = [case1Definition];
let adapterFactory: AdapterFactory
let adapterStatusCallback: any
let registerDataAccess: RegisterDataAccess

const stepDefinitions: StepDefinition[] = [];
stepMocksSuites.forEach(suite => {
    stepDefinitions.push(suite.definition)
})
let stepFactory: StepFactory
let stepStatusCallback: any
let stepErrorCallback: any

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
                adapterFactory
            }
            stepFactory = new StepFactory(stepDefinitions, stepDependencies)
        });

        test("Presenter calls", async () => {
            const step1 = stepFactory.createStepRunner(definition.id)
            const finalStepStatus = await step1.run(defaultRunOptions);
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

        test("Adapter run options", async () => {
            const step1 = stepFactory.createStepRunner(definition.id)
            await step1.run(defaultRunOptions);
            runOptionsEqual(adapterStatusCallback.mock.results[2].value.runOptions, mocks.mockAdapterRunOptions)
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

