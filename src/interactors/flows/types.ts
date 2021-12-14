  
// export enum FlowStatusTag {
//     pending = "pending", //pendiente de ejecución
//     active = "active", //Ejecutandose
//     success = "success", //sin erroes
//     error = "error", //SW error
// }

// export type FlowData = {
//     id: string
//     correlationId: string, //retries
//     definitionId: string
//     statusTag: FlowStatusTag  //debugging
//     statusMeta: object
//     timeStarted: Date,  //debugging
//     timeFinished: Date,  //debugging
//     exceptionTrace: object, //debugging
//     meta: object
//   }

// export interface Flow <fdo extends FlowDefinitionOptions, fd extends FlowDefinition<fdo>>{
//     runOnce(definitionOptions?:fdo,[{stepDefinitionId, mockData}]?): Promise<string> //start a flow from the beginning
//     continue(): Promise<void> //continue flow from the last success or partial success step.
//     getData(): Promise<FlowData>
//     getDefinitionOptions(): Promise<FlowDefinitionOptions>
//     getDefinition(): Promise<fd>
// }


// export type FlowDefinitionOptions = { //inputData for de definition, not for the flow
// }

// export interface FlowDefinition<fdo extends FlowDefinitionOptions> {
//    id:string
//    name:string
//    version:string
//    description:string
// }
