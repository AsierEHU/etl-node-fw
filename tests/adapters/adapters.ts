
// type result2Class = {
//     successTotal: number
// }


// export const testFlex: LocalAdapterFlexDefinition<result2Class> = {
//     id: "testFlex",
//     outputType: "result2Class",
//     definitionType: "LocalAdapterFlexDefinition",
//     async entitiesGet(registerDataAccess: RegisterDataAccess<Entity>, syncContext: RegisterDataContext) {
//         const filter: RegisterDataFilter = {
//             flowId: syncContext.flowId,
//             registerType: "resultClass"
//         }
//         const registers = await registerDataAccess.getAll(filter)
//         const entities = registers.map(reg => reg.entity)
//         return [{
//             successTotal: entities.length
//         }]
//     }
// }