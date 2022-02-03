import { uniqBy } from "lodash"
import { RegisterStatusTag } from "../../business/register";
import { RegisterDataAccess } from "../common/registers";


export class RegistersHistoricalReport {

    private readonly registerDataAccess: RegisterDataAccess

    constructor(dependencies: any) {
        this.registerDataAccess = dependencies.registerDataAccess
    }

    async getReport(flowDefinitionId: string, stepDefinitionId: string, entityId: string): Promise<any> {

    }
}
