import { StepRunOptions } from "../../steps/processes/types";

export abstract class LocalLinealFlowDefinition implements FlowDefinition {
    abstract readonly id: string
    abstract readonly definitionType: string;
    abstract readonly stepsDefinitionFlow: { id: string, runOptions?: StepRunOptions, successMandatory?: boolean }[]
}

export interface FlowDefinition {
    id: string
    readonly definitionType: string
}
