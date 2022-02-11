import { uniqBy } from "lodash"
import { RegisterStatusTag } from "../../business/register";
import { RegisterDataAccess } from "../common/registers";


export class RegistersFlowMetricsReport {

    private readonly registerDataAccess: RegisterDataAccess

    constructor(dependencies: any) {
        this.registerDataAccess = dependencies.registerDataAccess
    }

    async getReport(flowId: string, entityId: string): Promise<any> {

    }
}
