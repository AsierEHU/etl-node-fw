import EventEmitter from 'events';
import { cloneDeep } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { SyncContext } from '../../registers/types';
import { Flow, FlowDefinition, FlowRunOptions } from '../processes/types';
import { FlowRunner, FlowStatusTag, FlowStatus } from './types';

export class LocalFlowRunner implements FlowRunner {

    public readonly flow: Flow<FlowDefinition>;
    private readonly flowPresenter: EventEmitter

    constructor(dependencies: any) {
        this.flow = dependencies.flow;
        this.flowPresenter = dependencies.flowPresenter;
    }

    async run(runOptions?: FlowRunOptions) {
        runOptions = cloneDeep(runOptions)
        const flowStatus = this.buildStatus(runOptions?.syncContext)
        runOptions = { ...runOptions, syncContext: { ...runOptions?.syncContext, flowId: flowStatus.id } }
        this.flowPresenter.emit("flowStatus", cloneDeep(flowStatus))

        flowStatus.statusTag = FlowStatusTag.active
        this.flowPresenter.emit("flowStatus", cloneDeep(flowStatus))

        try {
            const flowSummary = await this.flow.run(runOptions)
            flowStatus.statusSummary = flowSummary
            if (flowSummary.stepFailedId) {
                flowStatus.statusTag = FlowStatusTag.failed
            } else {
                flowStatus.statusTag = FlowStatusTag.success
            }
        } catch (error: any) {
            flowStatus.statusTag = FlowStatusTag.failed
            flowStatus.statusMeta = error.message
        }

        this.flowPresenter.emit("flowStatus", cloneDeep(flowStatus))
        return cloneDeep(flowStatus);
    }

    private buildStatus(syncContext?: SyncContext): FlowStatus {
        const id = uuidv4();
        const flowDefinition = this.flow.flowDefinition;
        const flowStatus: FlowStatus = {
            id,
            definitionId: flowDefinition.id,
            definitionType: flowDefinition.definitionType,
            statusTag: FlowStatusTag.pending,
            statusMeta: null,
            statusSummary: {
                timeStarted: null,
                timeFinished: null,
                stepFailedId: null,
                stepsSuccess: 0,
                stepsTotal: 0
            },
            syncContext: { ...syncContext, flowId: id }
        }
        return flowStatus
    }
}