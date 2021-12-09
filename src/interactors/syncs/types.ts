

// //------------- Entities ---------------

// import { FlowData, StepStatus } from "./data"


// //EVENTOS para calcular?????????
// //Casos de uso tecnicos
// //-metrics
// //-events
// //-logs
// //-cache
// //-testing


// export type SyncOptions = {
//     flowdefinitionId: string,
//     flowDefinitionOptions?: FlowDefinitionOptions
// }

// //Casos de uso de negocio

// //Controlar concurrencias del mismo tipo de Flow
// //Iniciar un nuevo Flow (new id)
// //Iniciar un nuevo Flow para poder testear (new id, mock data)
// //Iniciar un flow existente desde el último step exitoso o parcialmente exitoso (continue same id)
// //Iniciar un flow existente desde el primer paso conservando el input inicial (restart new id, correlation id)
// //Iniciar un flow solo con los records que se han arreglado erroneos del anterior flow (new id, correlation id, mockdata)
// //Iniciar un step evitando duplicados (skipProccessedRecords)
// //Iniciar un step filtrando por ids

// export interface Sync {
//     startNewFlow:(syncOptions:SyncOptions,mockData?:[{stepDefinitionId:string, mockData:any}])=>Promise<string>; //Mock could be triaged data
//     continueExistingFlow:(flowId)=>Promise<void>
//     restartExistingFlow:(flowId) => Promise<void>
//     existActiveFlow:(definitionId:string)=>Promise<boolean>;
//     continueAllActiveFlows:()=> Promise<void>
// }




