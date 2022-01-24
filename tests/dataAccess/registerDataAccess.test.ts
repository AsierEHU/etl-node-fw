import { RegisterDataAccess, VolatileRegisterDataAccess } from "../../src";
import { Register, RegisterStatusTag } from "../../src/business/register";


const dataAccessTypes: { dataAccess: RegisterDataAccess, type: string }[] = [
    {
        dataAccess: new VolatileRegisterDataAccess(),
        type: "Volatile Register Data Access"
    }
]

const mockInitialRegisters: Register[] = [
    {
        id: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea644",
        entityType: "testClass",
        sourceAbsoluteId: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea644",
        sourceRelativeId: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea644",
        sourceEntityId: null,
        statusTag: RegisterStatusTag.success,
        statusMeta: null,
        entity: {
            test: "true",
        },
        meta: null,
        date: new Date(),
        definitionId: "testDefinition",
        syncContext: {
            flowId: "testFlow",
            stepId: "testStep",
            adapterId: "testAdapter",
        },
    }
]


const registerDataAccessTest = (
    dataAccess: RegisterDataAccess,
    type: string
) => {

    describe("Register Data Access " + type, () => {

        beforeEach(async () => {
            await dataAccess.removeAll()
            await dataAccess.saveAll(mockInitialRegisters)
        });

        afterEach(async () => {

        })

        describe("Remove all", () => {

            test("Adapter filter", async () => {
                await dataAccess.removeAll({ adapterId: "testAdapter" })
                const registers = await dataAccess.getAll()
                expect(registers).toEqual([])
            })
        })

    })

}

dataAccessTypes.forEach(({ dataAccess, type }) => {
    registerDataAccessTest(dataAccess, type)
})