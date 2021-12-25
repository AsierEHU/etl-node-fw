import { EventEmitter } from "stream";
import { VolatileRegisterDataAccess } from "../../src/dataAccess/volatile";
import { AdapterFactory } from "../../src/interactors/adapters/factory";
import { AdapterRunnerRunOptions } from "../../src/interactors/adapters/types";
import { SyncContext } from "../../src/interactors/registers/types";
import { StepFactory } from "../../src/interactors/steps/factory";
import { StepDefinition, StepStatus } from "../../src/interactors/steps/types";
import { case1Definition, case1Mocks } from "../adapters/localAdapterExtractorMocks/case1Mocks";
import { stepMocksSuites } from "./mocks";

let presenter = new EventEmitter()
let adapterDefinitions = [case1Definition];
let registerDataAccess = new VolatileRegisterDataAccess();
let adapterFactory = new AdapterFactory(adapterDefinitions)
let adapterDependencies = {
    adapterPresenter: presenter,
    registerDataAccess
}

const syncContext: SyncContext = {
    flowId: "testFlow",
}
let defaultRunOptions: AdapterRunnerRunOptions = {
    syncContext
}
let stepDefinitions: StepDefinition[] = [];
stepMocksSuites.forEach(suite => {
    stepDefinitions.push(suite.definition)
})
const stepFactory = new StepFactory(stepDefinitions)
const stepDependencies = {
    stepPresenter: presenter,
    adapterDependencies,
    adapterFactory,
    syncContext
}
let stepPresenterCallback = jest.fn(stepStatus => {
    return stepStatus
})

const stepTest = (
    definition: StepDefinition,
    mocks: {
        mockInitialStatus: StepStatus,
        mockFinalStatus: StepStatus,
    }
) => {
    describe(definition.definitionType + " - " + definition.id + " status test", () => {

        beforeEach(() => {
            presenter.removeAllListeners("stepStatus")
            stepPresenterCallback = jest.fn(stepStatus => {
                return stepStatus
            })
        });

        test("Presenter calls", async () => {
            presenter.on("stepStatus", stepPresenterCallback)
            const step1 = stepFactory.createStepRunner(definition.id, stepDependencies)
            const finalStepStatus = await step1.run(defaultRunOptions);
            statusEqual(finalStepStatus, mocks.mockFinalStatus)
            expect(stepPresenterCallback.mock.calls.length).toBe(3)
            statusEqual(stepPresenterCallback.mock.results[0].value, mocks.mockInitialStatus)
            statusEqual(stepPresenterCallback.mock.results[2].value, mocks.mockFinalStatus)
        })

    })
}

const statusEqual = (stepStatus: StepStatus, mockStatus: StepStatus) => {
    expect(stepStatus.id).not.toBeNull()
    expect(stepStatus.syncContext.stepId).not.toBeNull()
    expect(stepStatus.id).toEqual(stepStatus.syncContext.stepId)
    stepStatus.id = mockStatus.id
    stepStatus.syncContext.stepId = mockStatus.id
    stepStatus.statusSummary.timeFinished = mockStatus.statusSummary.timeFinished
    stepStatus.statusSummary.timeStarted = mockStatus.statusSummary.timeStarted
    expect(stepStatus).toEqual(mockStatus)
}

stepMocksSuites.forEach(suite => {
    stepTest(suite.definition, suite.mocks)
})

