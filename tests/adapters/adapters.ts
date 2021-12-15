// import { Entity, RegisterDataContext } from "../../src/interactors/registers/types";


// type outputClass = {
//     text: string,
//     others: {
//         x: number,
//     }
// }

// type resultClass = {
//     success: boolean,
// }

// type result2Class = {
//     successTotal: number
// }


// export const testLoader: LocalAdapterLoaderDefinition<outputClass, resultClass> = {
//     id: "testLoader",
//     definitionType: "LocalAdapterLoaderDefinition",
//     inputType: "outputClass",
//     outputType: "resultClass",
//     async entityLoad(entity: outputClass | null) {
//         return {
//             success: true,
//         } as resultClass;
//     },
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