// import { MyStep, MyStepDefintion } from "./definitions/my_first_definition";
// import { Step, StepDefinition } from "./types"

// export class StepBuilder {
//     private readonly stepDefinitionsMap:{[key:string]:StepDefinition<any>}
//     // private readonly stepDataAccess: StepDataAccess

//     constructor(stepDefinitions:Array<StepDefinition<any>>){
//         this.stepDefinitionsMap = stepDefinitions.reduce((map, stepDefinition) => ({ ...map, [stepDefinition.id]: stepDefinition}), {}) 
//     }

//     public buildStep(definitionId:string): Step<any>{
//         const stepDefinition = this.stepDefinitionsMap[definitionId];

//         if(stepDefinition instanceof MyStepDefintion){
//             const dependencies = {
//             }
//             return new MyStep(dependencies);
//         }
//     }
// }

