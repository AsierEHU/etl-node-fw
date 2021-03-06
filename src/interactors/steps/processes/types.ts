
import { SyncContext } from "../../../business/register";
import { InputEntity } from "../../adapters/definitions/localAdapter/types";
import { StepDefinition } from "../definitions/types";

export interface Step<sd extends StepDefinition> {
    stepDefinition: sd
    run(syncContext: SyncContext, runOptions?: StepRunOptions): Promise<void>
}

export type StepRunOptions = {
    pushEntities?: { [type: string]: InputEntity<any>[] },
}