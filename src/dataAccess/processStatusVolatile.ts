import { ProcessStatus } from "../business/processStatus";
import { ProcessStatusDataAccess, ProcessStatusDataFilter } from "../interactors/common/processes";

export class VolatileProcessStatusDataAccess implements ProcessStatusDataAccess {

    private readonly repo: {
        [x: string]: ProcessStatus
    };

    constructor(processStatusList?: ProcessStatus[]) {
        this.repo = {}
        if (processStatusList)
            for (const processStatus of processStatusList) {
                if (this.repo[processStatus.id])
                    throw new Error(`ProcessStatus with id ${processStatus.id} already exist`);
                this.repo[processStatus.id] = processStatus
            }
    }

    async save(status: ProcessStatus) {
        this.repo[status.id] = status
    };

    async get(id: string) {
        return this.repo[id]
    }

    async getAll(filter?: ProcessStatusDataFilter) {

        let repoStatusList = Object.values(this.repo);

        if (filter?.adapterId)
            repoStatusList = repoStatusList.filter(repoStatus => repoStatus.syncContext.adapterId == filter.adapterId)
        if (filter?.stepId)
            repoStatusList = repoStatusList.filter(repoStatus => repoStatus.syncContext.stepId == filter.stepId)
        if (filter?.flowId)
            repoStatusList = repoStatusList.filter(repoStatus => repoStatus.syncContext.flowId == filter.flowId)
        if (filter?.definitionId)
            repoStatusList = repoStatusList.filter(repoStatus => repoStatus.definitionId == filter.definitionId)
        if (filter?.type)
            repoStatusList = repoStatusList.filter(repoStatus => repoStatus.processType == filter.type)

        return repoStatusList;
    };

}
