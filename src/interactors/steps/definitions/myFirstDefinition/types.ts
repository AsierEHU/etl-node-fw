import EventEmitter from "events";
import { AdapterFactory } from "../../../adapters/factory";
import { StepDefinition, StepDependencies, StepStatusSummary } from "../../types";

export abstract class MyStepDefinition implements StepDefinition {
    abstract readonly adapterDefinitionId: string;
    abstract readonly definitionType: string;
    abstract readonly id: string
    abstract readonly retartTries: number
    abstract isFailedStatus(statusSummary: StepStatusSummary): boolean
}

export interface MyStepDependencies<sp extends MyStepDefinition> extends StepDependencies<sp> {
    adapterBuilder: AdapterFactory
    stepPresenter: EventEmitter
    adapterDependencies: any
}