import { EventEmitter } from "stream";
import { VolatileRegisterDataAccess } from "../../src/dataAccess/volatile";
import { AdapterFactory } from "../../src/interactors/adapters/factory";
import { SyncContext } from "../../src/interactors/registers/types";
import { StepFactory } from "../../src/interactors/steps/factory";
import { StepDefinition, StepRunOptions, StepStatus } from "../../src/interactors/steps/types";
import { case1Definition } from "../adapters/localAdapterExtractorMocks/case1Mocks";
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

        test("Initial status", async () => {
            const step1 = stepFactory.createStep(definition.id, stepDependencies)
            const stepStatus = await step1.getStatus();
            statusEqual(stepStatus, mocks.mockInitialStatus)
        })

        test("Final status", async () => {
            const step1 = stepFactory.createStep(definition.id, stepDependencies)
            await step1.run();
            const stepStatus = await step1.getStatus()
            statusEqual(stepStatus, mocks.mockFinalStatus)
        })

        test("Presenter calls", async () => {
            presenter.on("stepStatus", stepPresenterCallback)
            const step1 = stepFactory.createStep(definition.id, stepDependencies)
            await step1.run();
            expect(stepPresenterCallback.mock.calls.length).toBe(3)
            statusEqual(stepPresenterCallback.mock.results[0].value, mocks.mockInitialStatus)
            statusEqual(stepPresenterCallback.mock.results[2].value, mocks.mockFinalStatus)

        })

        test("Final status: runOptions", async () => {
            const step1 = stepFactory.createStep(definition.id, stepDependencies)
            const runOptions: StepRunOptions = { inputEntities: [] }
            await step1.run(runOptions);
            const stepStatus = await step1.getStatus()
            expect(stepStatus.runOptions).toEqual(runOptions)
        })

        test("Presenter calls: runOptions", async () => {
            presenter.on("stepStatus", stepPresenterCallback)
            const step1 = stepFactory.createStep(definition.id, stepDependencies)
            const runOptions: StepRunOptions = { inputEntities: [] }
            await step1.run(runOptions);
            expect(stepPresenterCallback.mock.results[0].value.runOptions).toBe(null)
            expect(stepPresenterCallback.mock.results[2].value.runOptions).toEqual(runOptions)
        })

        test("Run once exception", async () => {
            const step1 = stepFactory.createStep(definition.id, stepDependencies)
            step1.run()
            await expect(step1.run()).rejects.toEqual(new Error("Run once"))
        });

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

stepMocksSuites.forEach(suite => {
    stepTest(suite.definition, suite.mocks)
})