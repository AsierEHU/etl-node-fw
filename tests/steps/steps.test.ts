import { EventEmitter } from "stream";
import { VolatileRegisterDataAccess } from "../../src/dataAccess/volatile";
import { AdapterFactory } from "../../src/interactors/adapters/factory";
import { SyncContext } from "../../src/interactors/registers/types";
import { StepFactory } from "../../src/interactors/steps/factory";
import { StepDefinition, StepStatus } from "../../src/interactors/steps/types";
import { case3Definition } from "../adapters/localAdapterTranformerMocks/case3Mocks";
import { localStepDefinition, localStepMocks } from "./localStepMocks";

let presenter = new EventEmitter()
let adapterDefinitions = [case3Definition];
let registerDataAccess = new VolatileRegisterDataAccess();
let adapterFactory = new AdapterFactory(adapterDefinitions)
let adapterDependencies = {
    adapterPresenter: presenter,
    registerDataAccess
}

const syncContext: SyncContext = {
    flowId: "testFlow",
}
const stepDefinitions = [localStepDefinition]
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
    describe(definition.definitionType + " status test", () => {

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
            await step1.runOnce();
            const stepStatus = await step1.getStatus()
            statusEqual(stepStatus, mocks.mockFinalStatus)
        })

        test("Presenter calls", async () => {
            presenter.on("stepStatus", stepPresenterCallback)
            const step1 = stepFactory.createStep(definition.id, stepDependencies)
            try {
                await step1.runOnce();
                expect(stepPresenterCallback.mock.calls.length).toBe(3)
                statusEqual(stepPresenterCallback.mock.results[0].value, mocks.mockInitialStatus)
                statusEqual(stepPresenterCallback.mock.results[2].value, mocks.mockFinalStatus)
            } catch (error: any) {
                expect(error.message).toBe("Test custom Error")
            }
        })

        // test("Final status: runOptions", async () => {
        //     const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
        //     const runOptions = { onlyFailedEntities: true, inputEntities: mocks.inputEntities }
        //     await adapter1.runOnce(runOptions);
        //     const stepStatus = await adapter1.getStatus()
        //     expect(stepStatus.runOptions).toEqual(runOptions)
        // })

        // test("Final presenter: runOptions", (done) => {
        //     const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
        //     const runOptions = { onlyFailedEntities: true, inputEntities: mocks.inputEntities }
        //     adapterPresenter.on("stepStatus", (stepStatus) => {
        //         expect(stepStatus.runOptions).toEqual(runOptions)
        //         done()
        //     })
        //     adapter1.runOnce({ onlyFailedEntities: true, inputEntities: mocks.inputEntities })
        // })

        // test("Run once exception", async () => {
        //     const adapter1 = adapterFactory.createAdapter(definition.id, adapterDependencies)
        //     adapter1.runOnce()
        //     await expect(adapter1.runOnce()).rejects.toEqual(new Error("Run once"))
        // });

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

stepTest(localStepDefinition, localStepMocks)