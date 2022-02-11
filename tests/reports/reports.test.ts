import { RegistersHistoricalReport, Report, VolatileProcessStatusDataAccess, VolatileRegisterDataAccess } from "../../src";
import { ProcessStatus, ProcessType, StatusTag } from "../../src/business/processStatus";
import { Register, RegisterStatusTag } from "../../src/business/register";



const mockInitialRegisters: Register[] = [
    {
        id: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea644",
        entityType: "testClass",
        sourceAbsoluteId: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea644",
        sourceRelativeId: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea644",
        sourceEntityId: "testId",
        statusTag: RegisterStatusTag.success,
        statusMeta: null,
        entity: {
            test: "true",
        },
        meta: null,
        date: new Date("04/02/2022"),
        definitionId: "testDefinition",
        syncContext: {
            flowId: "abd1c577-a6aa-40b1-bdee-52f3ee0ea644",
            stepId: "testStep",
            adapterId: "testAdapter",
        },
    },
    {
        id: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea645",
        entityType: "testClass",
        sourceAbsoluteId: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea645",
        sourceRelativeId: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea645",
        sourceEntityId: "testId",
        statusTag: RegisterStatusTag.success,
        statusMeta: null,
        entity: {
            test: "false",
        },
        meta: null,
        date: new Date("06/06/2022"),
        definitionId: "testDefinition",
        syncContext: {
            flowId: "abd1c577-a6aa-40b1-bdee-52f3ee0ea645",
            stepId: "testStep",
            adapterId: "testAdapter",
        },
    }
]

const mockInitialProcesses: ProcessStatus[] = [
    {
        id: "abd1c577-a6aa-40b1-bdee-52f3ee0ea644",
        definitionId: "testFlowDefinition",
        statusTag: StatusTag.success,
        statusMeta: null,
        timeStarted: null,
        timeFinished: null,
        runOptions: null,
        syncContext: { flowId: "abd1c577-a6aa-40b1-bdee-52f3ee0ea644" },
        processType: ProcessType.flow
    },
    {
        id: "abd1c577-a6aa-40b1-bdee-52f3ee0ea645",
        definitionId: "testFlowDefinition",
        statusTag: StatusTag.success,
        statusMeta: null,
        timeStarted: null,
        timeFinished: null,
        runOptions: null,
        syncContext: { flowId: "abd1c577-a6aa-40b1-bdee-52f3ee0ea645" },
        processType: ProcessType.flow
    }
]

const registerDataAccess = new VolatileRegisterDataAccess(mockInitialRegisters)
const processStatusDataAccess = new VolatileProcessStatusDataAccess(mockInitialProcesses)

const reportsTypes: { report: Report, type: string, config: any, result: any }[] = [
    {
        report: new RegistersHistoricalReport({ registerDataAccess, processStatusDataAccess }),
        type: "Register Historical Report",
        config: { flowDefinitionId: "testFlowDefinition", entityType: "testClass", entityId: "testId" },
        result: [
            {
                id: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea645",
                entityType: "testClass",
                sourceAbsoluteId: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea645",
                sourceRelativeId: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea645",
                sourceEntityId: "testId",
                statusTag: RegisterStatusTag.success,
                statusMeta: null,
                entity: {
                    test: "false",
                },
                meta: null,
                date: new Date("06/06/2022"),
                definitionId: "testDefinition",
                syncContext: {
                    flowId: "abd1c577-a6aa-40b1-bdee-52f3ee0ea645",
                    stepId: "testStep",
                    adapterId: "testAdapter",
                },
            },
            {
                id: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea644",
                entityType: "testClass",
                sourceAbsoluteId: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea644",
                sourceRelativeId: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea644",
                sourceEntityId: "testId",
                statusTag: RegisterStatusTag.success,
                statusMeta: null,
                entity: {
                    test: "true",
                },
                meta: null,
                date: new Date("04/02/2022"),
                definitionId: "testDefinition",
                syncContext: {
                    flowId: "abd1c577-a6aa-40b1-bdee-52f3ee0ea644",
                    stepId: "testStep",
                    adapterId: "testAdapter",
                },
            },
        ]
    }
]

const reportTest = (
    report: Report,
    type: string,
    config: any,
    result: any
) => {

    describe("Report: " + type, () => {

        beforeEach(async () => {

        });

        afterEach(async () => {

        })

        test("Get Report", async () => {
            const restResult = await report.getReport(config)
            expect(restResult).toEqual(result)
        })
    })
}

reportsTypes.forEach(({ report, type, config, result }) => {
    reportTest(report, type, config, result)
})