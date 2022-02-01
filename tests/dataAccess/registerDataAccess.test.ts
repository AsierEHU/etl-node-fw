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

const mockNewRegisters = [
    {
        id: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea645",
        entityType: "testClass",
        sourceAbsoluteId: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea645",
        sourceRelativeId: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea645",
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
    },
    {
        id: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea646",
        entityType: "testClass",
        sourceAbsoluteId: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea646",
        sourceRelativeId: "ebd1c577-a6aa-40b1-bdee-52f3ee0ea646",
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

    describe("Register Data Access: " + type, () => {

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

        describe("Get all", () => {
            test("Adapter filter", async () => {
                const adapterId = "testAdapter"
                const registers = await dataAccess.getAll({ adapterId: adapterId })
                const mockRegisters = mockInitialRegisters.filter(reg => reg.syncContext.adapterId === adapterId)
                expect(registers).toEqual(mockRegisters)
            })
            test("Excluding entity payload", async () => {
                const registers = await dataAccess.getAll({ excludeOptions: { excludeEntityPayload: true } })
                for (const register of registers) {
                    expect(register.entity).toEqual(null)
                }
            })
        })

        describe("Get one", () => {
            test("By id", async () => {
                const id = "ebd1c577-a6aa-40b1-bdee-52f3ee0ea644"
                const register = await dataAccess.get(id)
                const mockRegisters = mockInitialRegisters.filter(reg => reg.id === id)[0]
                expect(register).toEqual(mockRegisters)
            })
        })

        describe("Save", () => {
            test("One register", async () => {
                await dataAccess.save(mockNewRegisters[0])
                const register = await dataAccess.get(mockNewRegisters[0].id)
                expect(register).toEqual(mockNewRegisters[0])
            })
        })

        describe("Save all", () => {
            test("Multiple registers", async () => {
                await dataAccess.saveAll(mockNewRegisters)
                const registers = await dataAccess.getAll({ registersIds: mockNewRegisters.map(reg => reg.id) })
                expect(registers).toEqual(mockNewRegisters)
            })
        })
    })
}

dataAccessTypes.forEach(({ dataAccess, type }) => {
    registerDataAccessTest(dataAccess, type)
})