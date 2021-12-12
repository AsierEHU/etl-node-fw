
// class FlowBuilder { 

//     private readonly flowDataAccess: FlowDataAccess
//     private readonly flowDefinitionsMap:{[key:string]:FlowDefinition<FlowDefinitionOptions>}

//     constructor(dependencies:{flowDefinitions:Array<FlowDefinition<FlowDefinitionOptions>>, flowDataAccess: FlowDataAccess}){
//         this.flowDefinitionsMap = dependencies.flowDefinitions.reduce((map, flowDefinition) => ({ ...map, [flowDefinition.id]: flowDefinition}), {})
//         this.flowDataAccess = dependencies.flowDataAccess;
//     }

//     async getFlowsByStatus(status:string){

//     }

//     async getFlowById(id:string){
//         const flowData = await this.flowDataAccess.get(id)
//         return this.buildFlowByDefinition(flowData.definitionId, flowData)
//     }

//     async buildFlowByDefinition(definitionId:string, initData: any):Promise<Flow<FlowDefinitionOptions,FlowDefinition<FlowDefinitionOptions>>>{

//         const flowDefinition = this.flowDefinitionsMap[definitionId];

//         if(flowDefinition instanceof MyFlowDefinition){
//             return await this.buildMyFlow(flowDefinition, initData)
//         }

//     }

//     private async buildMyFlow( flowDefinition: MyFlowDefinition, initData:any){

//         if(!initData.id){
//             initData.id = "" //Generate unique id
//         };

//         const flowDependencies = {
//             flowDataAccess: this.flowDataAccess,
//             flowDefinition: flowDefinition,
//             flowData: initData,
//         }

//         return new MyFlow(flowDependencies);
//     }
// }
