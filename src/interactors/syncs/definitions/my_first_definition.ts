
// // Entities (custom implementation)

// import { StepStatusTag } from "../types/data"
// import { RegisterFetcher } from "../types/dataAccess"
// import { FlowDefinition, FlowDefinitionOptions, StepDefinition, Sync } from "../types/entities"

// //type FlowPresenter = (flowStatus: FlowStatus)=>Promise<void> //output data
// //type StepPresenter = (StepStatus: StepStatus)=>Promise<void> //output data
// //type EntityPresenter<e extends object> = (AdapterStatus: AdapterStatus<e>) =>Promise<void> //output data

// // class FlowEventEmitter extends events.EventEmitter{
// //     emit()
// // }

// // class StepEventEmitter extends events.EventEmitter{
// //     emit()
// // }

// // class SyncEventEmitter extends events.EventEmitter{
// //     emit()
// // }

// // class FlowEventListener extends events.EventEmitter{
// //     on()
// // }

// // class StepEventListener extends events.EventEmitter{
// //     on()
// // }

// // class SyncEventListener extends events.EventEmitter{
// //     on()
// // }




// //Custom controllers

// /**
//  * Use cases controller with flows. Singleton
//  */
// class MySync implements Sync{

//     private readonly flowBuilder: FlowBuilder

//     constructor(dependencies){
//         this.flowBuilder = dependencies.flowBuilder;
//     }

//     continueAllActiveFlows: () => Promise<void>


//     async startNewFlow(syncOptions: SyncOptions, mockData?: [{ stepDefinitionId: any; mockData: any }]): Promise<string>{
//         const newFlow = await this.flowBuilder.buildFlowByDefinition(syncOptions.flowdefinitionId,{});
//         newFlow.start(syncOptions.flowDefinitionOptions, mockData);
//         return (await newFlow.getData()).id;
//     }
    
//     existActiveFlow: (definitionId: string) => Promise<boolean>


//     async continueExistingFlow(flowId: string): Promise<void>{
//         const flow = await this.flowBuilder.getFlowById(flowId);
//         flow.continue()
//     }
    
//     async restartExistingFlow(flowId: any): Promise<void>{
//         const oldFlow = await this.flowBuilder.getFlowById(flowId);
//         const flowDefinitionOptions = await oldFlow.getDefinitionOptions()
//         const {correlationId, definitionId} = await oldFlow.getData()
//         const newFlow = await this.flowBuilder.buildFlowByDefinition(definitionId, {correlationId: correlationId || flowId})
//         newFlow.start(flowDefinitionOptions)
//     }
    
// }
