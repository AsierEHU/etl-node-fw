import { EventEmitter } from "stream";
import { VolatileRegisterDataAccess } from "../../src/dataAccess/volatile";
import { AdapterFactory } from "../../src/interactors/adapters/factory";
import { RegisterDataAccess, RegisterStatusTag, reservedRegisterEntityTypes, SyncContext } from "../../src/interactors/registers/types";
import { FlowFactory } from "../../src/interactors/flows/factory";
import { FlowDefinition, FlowRunOptions } from "../../src/interactors/flows/processes/types";
import { case1Definition as adapterCase1Definition } from "../adapters/localAdapterExtractorMocks/case1Mocks";
import { flowMocks } from "./mocks";
import { StepFactory } from "../../src/interactors/steps/factory";
import { case1Definition } from "../steps/localStepMocks/case1Mocks";
import { case2Definition } from "../steps/localStepMocks/case2Mocks";
import { case3Definition } from "../steps/localStepMocks/case3Mocks";
import { FlowStatus, FlowStatusTag } from "../../src/interactors/flows/runners/types";
import { testSources } from "../adapters/adapter.test";

const adapterDefinitions = [adapterCase1Definition];
let adapterFactory: AdapterFactory
let adapterStatusCallback: any
let registerDataAccess: RegisterDataAccess

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
        mockInitialStatus: FlowStatus,
        mockFinalStatus: FlowStatus
    }
) => {

    describe(definition.definitionType, () => {

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
            const adapterDependencies = {
                adapterPresenter: presenter,
                registerDataAccess,
            }
            adapterFactory = new AdapterFactory(adapterDefinitions, adapterDependencies)

            const stepDependencies = {
                stepPresenter: presenter,
                registerDataAccess,
                adapterFactory
            }
            stepFactory = new StepFactory(stepDefinitions, stepDependencies)

            const flowDependencies = {
                flowPresenter: presenter,
                registerDataAccess,
                stepFactory
            }
            flowFactory = new FlowFactory(flowDefinitions, flowDependencies)
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
                const flow1 = flowFactory.createFlowRunner(definition.id)
                const finalFlowStatus = await flow1.run(defaultRunOptions);
                statusEqual(finalFlowStatus, mocks.mockFinalStatus)
                expect(flowStatusCallback.mock.calls.length).toBe(3)
                statusEqual(flowStatusCallback.mock.results[0].value, mocks.mockInitialStatus)
                statusEqual(flowStatusCallback.mock.results[2].value, mocks.mockFinalStatus)
                if (finalFlowStatus.statusTag == FlowStatusTag.failed) {
                    expect(flowErrorCallback).toBeCalled()
                }
                else {
                    expect(flowErrorCallback).not.toBeCalled()
                }
            })

        })

        describe(definition.definitionType + " - " + definition.id + " registers test", () => {

            test("runOptions:flowPushConfig", async () => {
                const entityConfigPushed = { msg: "Push config test" }
                const flow1 = flowFactory.createFlowRunner(definition.id)
                const runOptions: FlowRunOptions = { ...defaultRunOptions, flowPushConfig: entityConfigPushed }
                await flow1.run(runOptions);
                const registerConfigPushed = await registerDataAccess.getAll({ registerType: reservedRegisterEntityTypes.extractorConfig })
                expect(registerConfigPushed[0].entity).toEqual(entityConfigPushed)
            })

            test("Not pending registers", async () => {
                const flow1 = flowFactory.createFlowRunner(definition.id)
                await flow1.run(defaultRunOptions)
                const registers = await registerDataAccess.getAll()
                registers.forEach(register => {
                    expect(register.statusTag).not.toBe(RegisterStatusTag.pending)
                })
            })

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

flowMocks.forEach(suite => {
    flowTest(suite.definition, suite.mocks)
})

