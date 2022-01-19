import { EventEmitter } from "stream";
import { case1Definition as adapterCase1Definition } from "../adapters/localAdapterExtractorMocks/case1Mocks";
import { flowMocks } from "./mocks";
import { case1Definition } from "../steps/localStepMocks/case1Mocks";
import { case2Definition } from "../steps/localStepMocks/case2Mocks";
import { case3Definition } from "../steps/localStepMocks/case3Mocks";
import { FlowStatus } from "../../src/interactors/flows/runners/types";
import { testSources } from "../adapters/adapter.test";
import { AdapterFactory, RegisterDataAccess, StepFactory, FlowDefinition, FlowFactory, FlowRunOptions, VolatileRegisterDataAccess, reservedEntityTypes, VolatileProcessStatusDataAccess } from "../../src";
import { StatusTag } from "../../src/business/processStatus";
import { ProcessStatusDataAccess } from "../../src/interactors/common/processes";

const adapterDefinitions = [adapterCase1Definition];
let adapterFactory: AdapterFactory
let adapterStatusCallback: any
let registerDataAccess: RegisterDataAccess
let processStatusDataAccess: ProcessStatusDataAccess

const stepDefinitions = [case1Definition, case2Definition, case3Definition]
let stepFactory: StepFactory
let stepStatusCallback: any

const flowDefinitions: FlowDefinition[] = [];
flowMocks.forEach(suite => {
    flowDefinitions.push(suite.definition)
})
let flowFactory: FlowFactory
let flowStatusCallback: any
let flowErrorCallback: any

let defaultRunOptions: FlowRunOptions = {}


const flowTest = (
    definition: FlowDefinition,
    mocks: {
        mockInitialPresenter: FlowStatus,
        mockFinalPresenter: FlowStatus
    }
) => {

    describe(definition.definitionType + " - " + definition.id, () => {

        beforeEach(() => {
            const presenter = new EventEmitter()
            flowStatusCallback = jest.fn(flowStatus => {
                return flowStatus
            })
            flowErrorCallback = jest.fn(flowError => {
                return flowError
            })
            stepStatusCallback = jest.fn(stepStatus => {
                return stepStatus
            })
            adapterStatusCallback = jest.fn(adapterStatus => {
                return adapterStatus
            })
            presenter.on("adapterStatus", adapterStatusCallback)
            presenter.on("stepStatus", stepStatusCallback)
            presenter.on("flowStatus", flowStatusCallback)
            presenter.on("flowError", flowErrorCallback)

            registerDataAccess = new VolatileRegisterDataAccess()
            processStatusDataAccess = new VolatileProcessStatusDataAccess()
            const adapterDependencies = {
                adapterPresenter: presenter,
                registerDataAccess,
                processStatusDataAccess
            }
            adapterFactory = new AdapterFactory(adapterDefinitions, adapterDependencies)

            const stepDependencies = {
                stepPresenter: presenter,
                registerDataAccess,
                processStatusDataAccess,
                adapterFactory
            }
            stepFactory = new StepFactory(stepDefinitions, stepDependencies)

            const flowDependencies = {
                flowPresenter: presenter,
                registerDataAccess,
                processStatusDataAccess,
                stepFactory
            }
            flowFactory = new FlowFactory(flowDefinitions, flowDependencies)
        });

        afterEach(async () => {

            //TEST Not pending registers
            const registers = await registerDataAccess.getAll()
            registers.forEach(register => {
                expect(register.statusTag).not.toBe(StatusTag.pending)
            })

            //TEST Relative and Absolute ids
            for (const register of registers) {
                await testSources(register, registerDataAccess);
            }
        })

        describe("Status test", () => {

            test("Presenter calls", async () => {
                const flow1 = flowFactory.createFlowRunner(definition.id)
                const finalFlowStatus = await flow1.run(defaultRunOptions);
                presentersEqual(finalFlowStatus, mocks.mockFinalPresenter)
                expect(flowStatusCallback.mock.calls.length).toBe(3)
                presentersEqual(flowStatusCallback.mock.results[0].value, mocks.mockInitialPresenter)
                presentersEqual(flowStatusCallback.mock.results[2].value, mocks.mockFinalPresenter)
                if (finalFlowStatus.statusTag == StatusTag.failed) {
                    expect(flowErrorCallback).toBeCalled()
                }
                else {
                    expect(flowErrorCallback).not.toBeCalled()
                }
            })

        })

        describe("Registers test", () => {

            test("runOptions:flowConfig", async () => {
                const entityConfigPushed = { msg: "Push config test" }
                const flow1 = flowFactory.createFlowRunner(definition.id)
                const runOptions: FlowRunOptions = { ...defaultRunOptions, flowConfig: entityConfigPushed }
                await flow1.run(runOptions);
                const registerConfigPushed = await registerDataAccess.getAll({ entityType: reservedEntityTypes.flowConfig })
                expect(registerConfigPushed[0].entity).toEqual(entityConfigPushed)
            })

        })
    })

}

const presentersEqual = (flowStatus: FlowStatus, mockStatus: FlowStatus) => {
    expect(flowStatus.id).not.toBeNull()
    expect(flowStatus.syncContext.flowId).not.toBeNull()
    expect(flowStatus.id).toEqual(flowStatus.syncContext.flowId)
    flowStatus.id = mockStatus.id
    flowStatus.syncContext.flowId = mockStatus.id
    flowStatus.timeFinished = mockStatus.timeFinished
    flowStatus.timeStarted = mockStatus.timeStarted
    expect(flowStatus).toEqual(mockStatus)
}

flowMocks.forEach(suite => {
    flowTest(suite.definition, suite.mocks)
})

