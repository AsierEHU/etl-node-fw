// import { AdapterBuilder } from "../../adapters/builder";
// import {AdapterDefinition, AdapterStatusTag} from "../../adapters/types";
// import {Step, StepStatus, StepDefinition, StepStatusTag } from "../types"


// /**
//  * Local async step, persistance
//  */
// export class MyStep<sd extends MyStepDefintion> implements Step<sd>{

//     private readonly stepDefinition: sd;
//     private readonly adapterBuilder: AdapterBuilder;
//     private readonly stepStatus: StepStatus;
//         // entitiyFetcher: RegisterFetcher,
//         // entitiesKeeper: EntityKeeper<e>,

//     constructor(dependencies){
//         this.stepDefinition = dependencies.stepDefinition;
//         this.adapterBuilder = dependencies.adapterBuilder;
//         this.stepStatus = {
//             id:Math.random().toString(),
//             definitionId: this.stepDefinition.id,
//             statusTag: StepStatusTag.pending,
//             statusMeta: undefined,
//             timeStarted: undefined,
//             timeFinished: undefined,
//             exceptionTrace: undefined,
//             meta: undefined
//         }
//     }

//     async start(runOptions?){

//         this.stepStatus.timeStarted = new Date();
//         this.stepStatus.meta = {runOptions};

//         await this.tryRunAdapter(runOptions.adapterRunOptions);

//         this.stepStatus.timeFinished = new Date();

//         //save
//         return this.stepStatus.statusTag;
//     }

//     private async tryRunAdapter(adapterRunOptions:any, tryNumber?:number){
//         tryNumber = tryNumber | 1;
//         let status = null;
//         this.stepStatus.statusTag = StepStatusTag.active

//         try {
//             //Inject here step context into entitiesStorage to safe inside the step context?
//             const adapter = this.adapterBuilder.buildAdapter(this.stepDefinition.adapterDefinition.id)
//             status = await adapter.start(adapterRunOptions)
//             this.stepStatus.statusTag = StepStatusTag.success;
//         } catch (error) {
//             status = AdapterStatusTag.failed
//             this.stepStatus.statusMeta = error.message
//         }

//         if(tryNumber<=this.stepDefinition.retartTries && status == AdapterStatusTag.failed){
//             this.stepStatus.statusTag = StepStatusTag.failed;
//             await this.tryRunAdapter(adapterRunOptions, tryNumber++);
//         }

//     }

//     async getStatus() {
//         return this.stepStatus;
//     }
    
// }

// export abstract class MyStepDefintion implements StepDefinition {
//     // readonly stepClass = "MyStep"
//     readonly id:string
//     readonly name:string
//     readonly description:string
//     readonly retartTries:number
//     readonly skipProcessedRecords: boolean
//     readonly adapterDefinition: AdapterDefinition
//     readonly splitRecords: number
// }


// /**
//  * Utils
//  */

// export interface StepDataAccess {
//     save:(stepStatus:StepStatus)=>Promise<void>
//     get:(id:string)=>Promise<StepStatus>
// }
