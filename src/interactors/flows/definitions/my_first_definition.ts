// import { StepStatusTag } from "../types/data"
// import { RegisterFetcher, FixedEntity, ToFixEntity, ValidationResult } from "./types"
// import { AdapterDefinition, FlowDefinition, FlowDefinitionOptions, StepDefinition } from "../types/entities"

// export abstract class MyFlowDefinition implements FlowDefinition<MyFlowDefinitionOptions> {
//     readonly id:string
//     readonly name:string
//     readonly description:string
//     readonly stepsDefinition:[MyStepDefinition<object>]
//     finalStep?:(registerFetcher: RegisterFetcher)=>Promise<void> //always reached
//     shouldProcessConinue:(entities, stepStatusTag:StepStatusTag) => Promise<boolean>
// }

// export abstract class MyFlowDefinitionOptions implements FlowDefinitionOptions{

// }


// /**
//  * Lineal async flow, monolith, persistence
//  */
//  class MyFlow <MyFlowDefinitionOptions, fd extends MyFlowDefinition> implements Flow<MyFlowDefinitionOptions,fd> {

//     private readonly flowDefinition: fd
//     private readonly flowData: FlowData
//     private readonly flowDataAccess: FlowDataAccess
//     private readonly stepRepository: StepRepository

//     constructor(dependencies){
//     }

//     getDefinition(): Promise<fd> {
//         throw new Error("Method not implemented.")
//     }
//     getDefinitionOptions(): Promise<FlowDefinitionOptions> {
//         throw new Error("Method not implemented.")
//     }
//     continue(): Promise<void> {
//         throw new Error("Method not implemented.")
//     }
//     start(flowOptions?: MyFlowDefinitionOptions): Promise<string> {
//         //save MyFlowDefinitionOptions as an internal entity with a custom step -> initialStep?:Step
//         //When step fails -> keep retries number and the ids to retry

//         throw new Error("Method not implemented.")
//     }
//     getData(): Promise<FlowData> {
//         throw new Error("Method not implemented.")
//     }


// }


// export interface FlowDataAccess {
//     save:(flowData:FlowData)=>Promise<void>
//     get:(id:string)=>Promise<FlowData>
// }

