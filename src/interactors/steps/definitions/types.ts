import { AdapterRunOptions } from "../../adapters/processes/types";
import { RegisterStats } from "../../reports/types";

export abstract class LocalStepDefinition implements StepDefinition {
    abstract readonly adapterRunOptions: AdapterRunOptions | null;
    abstract readonly adapterDefinitionId: string;
    abstract readonly definitionType: string;
    abstract readonly id: string
    abstract readonly maxRetries: number
    abstract isInvalidRegistersSummary(statusSummary: RegisterStats): boolean
}

export interface StepDefinition {
    readonly id: string
    readonly definitionType: string
    readonly adapterDefinitionId: string
    readonly adapterRunOptions: AdapterRunOptions | null
}

