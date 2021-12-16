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

const stepTest = (
    definition: StepDefinition,
    mocks: {
        mockInitialStatus: StepStatus,
        mockFinalStatus: StepStatus,
        // mockFinalSummary: StepStatusSummary,
    }
) => {
    describe(definition.definitionType + " status test", () => {

        beforeEach(() => {
            presenter.removeAllListeners("stepStatus")
        });

        test("Initial status", async () => {
            const step1 = stepFactory.createStep(definition.id, stepDependencies)
            const stepStatus = await step1.getStatus();
            statusEqual(stepStatus, mocks.mockInitialStatus)
        })

        test("Initial presenter", (done) => {
            presenter.on("stepStatus", (stepStatus) => {
                statusEqual(stepStatus, mocks.mockInitialStatus)
                done()
            })
            stepFactory.createStep(definition.id, stepDependencies)
        })

        // test("Final summary", async () => {
        //     const step1 = stepFactory.createStep(definition.id, stepDependencies)
        //     const adapterStatusSummary = await adapter1.runOnce();
        //     expect(adapterStatusSummary).toEqual(mocks.mockFinalSummary)
        // })

        test("Final status", async () => {
            const step1 = stepFactory.createStep(definition.id, stepDependencies)
            await step1.runOnce();
            const stepStatus = await step1.getStatus()
            statusEqual(stepStatus, mocks.mockFinalStatus)
        })

        test("Final presenter", (done) => {
            const step1 = stepFactory.createStep(definition.id, stepDependencies)
            presenter.on("stepStatus", (stepStatus) => {
                statusEqual(stepStatus, mocks.mockFinalStatus)
                done()
            })
            step1.runOnce()
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