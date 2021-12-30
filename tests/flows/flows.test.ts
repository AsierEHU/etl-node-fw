import { EventEmitter } from "stream";
import { VolatileRegisterDataAccess } from "../../src/dataAccess/volatile";
import { AdapterFactory } from "../../src/interactors/adapters/factory";
import { AdapterRunnerRunOptions } from "../../src/interactors/adapters/runners/types";
import { RegisterDataAccess, SyncContext } from "../../src/interactors/registers/types";
import { FlowFactory } from "../../src/interactors/flows/factory";
import { FlowDefinition } from "../../src/interactors/flows/processes/types";
import { case1Definition as adapterCase1Definition } from "../adapters/localAdapterExtractorMocks/case1Mocks";
import { flowMocksSuites } from "./mocks";
import { StepFactory } from "../../src/interactors/steps/factory";
import { case1Definition } from "../steps/localStepMocks/case1Mocks";
import { case2Definition } from "../steps/localStepMocks/case2Mocks";
import { case3Definition } from "../steps/localStepMocks/case3Mocks";
import { FlowStatus } from "../../src/interactors/flows/runners/types";

const adapterDefinitions = [adapterCase1Definition];
let adapterFactory: AdapterFactory
let adapterPresenterCallback: any
let registerDataAccess: RegisterDataAccess

const stepDefinitions = [case1Definition, case2Definition, case3Definition]
let stepFactory: StepFactory
let stepPresenterCallback: any

const flowDefinitions: FlowDefinition[] = [];
flowMocksSuites.forEach(suite => {
    flowDefinitions.push(suite.definition)
})
let flowFactory: FlowFactory
let flowPresenterCallback: any

const syncContext: SyncContext = {
}
let defaultRunOptions: AdapterRunnerRunOptions = {
    syncContext
}


const flowTest = (
    definition: FlowDefinition,
    mocks: {
        mockInitialStatus: FlowStatus,
        mockFinalStatus: FlowStatus
    }
) => {
    describe(definition.definitionType + " - " + definition.id + " status test", () => {

        beforeEach(() => {
            const presenter = new EventEmitter()
            flowPresenterCallback = jest.fn(flowStatus => {
                return flowStatus
            })
            stepPresenterCallback = jest.fn(stepStatus => {
                return stepStatus
            })
            adapterPresenterCallback = jest.fn(adapterStatus => {
                return adapterStatus
            })
            presenter.on("adapterStatus", adapterPresenterCallback)
            presenter.on("stepStatus", stepPresenterCallback)
            presenter.on("flowStatus", flowPresenterCallback)

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

            const flowDependencies = {
                flowPresenter: presenter,
                stepFactory
            }
            flowFactory = new FlowFactory(flowDefinitions, flowDependencies)
        });

        test("Presenter calls", async () => {
            const flow1 = flowFactory.createFlowRunner(definition.id)
            const finalFlowStatus = await flow1.run(defaultRunOptions);
            statusEqual(finalFlowStatus, mocks.mockFinalStatus)
            expect(flowPresenterCallback.mock.calls.length).toBe(3)
            statusEqual(flowPresenterCallback.mock.results[0].value, mocks.mockInitialStatus)
            statusEqual(flowPresenterCallback.mock.results[2].value, mocks.mockFinalStatus)
        })

    })
}

const statusEqual = (flowStatus: FlowStatus, mockStatus: FlowStatus) => {
    expect(flowStatus.id).not.toBeNull()
    expect(flowStatus.syncContext.flowId).not.toBeNull()
    expect(flowStatus.id).toEqual(flowStatus.syncContext.flowId)
    flowStatus.id = mockStatus.id
    flowStatus.syncContext.flowId = mockStatus.id
    flowStatus.timeFinished = mockStatus.timeFinished
    flowStatus.timeStarted = mockStatus.timeStarted
    expect(flowStatus).toEqual(mockStatus)
}

flowMocksSuites.forEach(suite => {
    flowTest(suite.definition, suite.mocks)
})

