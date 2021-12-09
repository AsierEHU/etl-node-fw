// import { AdapterDefinition, AdapterRunOptions } from "../adapters/types";

// export interface Step<sd extends StepDefinition> {
//     start(stepRunOptions?: StepRunOptions): Promise<StepStatusTag> //start, if registers -> filter input by ids, if skip -> compare hash to skip
//     getStatus(): Promise<StepStatus>
// }

// export type StepRunOptions = {
//     adapterRunOptions?: AdapterRunOptions,
// }


// export interface StepDefinition {
//     id:string
//     name:string
//     // version:string
//     description:string
//     adapterDefinition:AdapterDefinition
//     // stepClass:string
// }

// export enum StepStatusTag {
//     pending = "pending", //pendiente de ejecución
//     active = "active", //Ejecutandose
//     success = "success", //sin erroes
//     failed = "failed", //Software error or all records in (failed, invalid)
// }

// export type StepStatus = {
//     id: string
//     // correlationId: string //retries
//     definitionId: string
//     // flowStatusId: string
//     // lastStepId: string,
//     statusTag: StepStatusTag //debugging
//     statusMeta: object
//     timeStarted: Date  //debugging
//     timeFinished: Date  //debugging
//     exceptionTrace: object, //debugging
//     meta: object
// }

