import EventEmitter from "events";
import { AdapterFactory } from "../../adapters/factory";
import { StepDefinition, StepDependencies } from "../types";

export interface MyStepDependencies<sp extends StepDefinition> extends StepDependencies<sp> {
    adapterFactory: AdapterFactory
    stepPresenter: EventEmitter
    adapterDependencies: any
}