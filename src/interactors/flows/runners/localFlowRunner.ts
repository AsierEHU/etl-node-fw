import EventEmitter from 'events';
import { cloneDeep } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { Flow, FlowDefinition, FlowRunOptions } from '../processes/types';
import { FlowRunner, FlowStatusTag, FlowStatus, } from './types';

export class LocalLinealFlowRunner implements FlowRunner {

    public readonly flow: Flow<FlowDefinition>;
    private readonly flowPresenter: EventEmitter

    constructor(dependencies: any) {
        this.flow = dependencies.flow;
        this.flowPresenter = dependencies.flowPresenter;
    }

    async run(runOptions?: FlowRunOptions) {
        runOptions = cloneDeep(runOptions)
        const flowStatus = this.buildStatus()
        this.flowPresenter.emit("flowStatus", cloneDeep(flowStatus))

        flowStatus.statusTag = FlowStatusTag.active
        flowStatus.timeStarted = new Date()
        this.flowPresenter.emit("flowStatus", cloneDeep(flowStatus))

        try {
            const flowSummary = await this.flow.run(flowStatus.syncContext, runOptions)
            flowStatus.statusSummary = flowSummary
            if (flowSummary.stepsPending) {
                throw new Error("Flow finished with pending steps")
            } else {
                flowStatus.statusTag = FlowStatusTag.success
            }
        } catch (error: any) {
            flowStatus.statusTag = FlowStatusTag.failed
            flowStatus.statusMeta = error.message
            this.flowPresenter.emit("flowError", { error, statusId: flowStatus.id })
        }

        flowStatus.timeFinished = new Date()
        this.flowPresenter.emit("flowStatus", cloneDeep(flowStatus))
        return cloneDeep(flowStatus);
    }

    private buildStatus(): FlowStatus {
        const id = uuidv4();
        const flowDefinition = this.flow.flowDefinition;
        const flowStatus: FlowStatus = {
            id,
            definitionId: flowDefinition.id,
            definitionType: flowDefinition.definitionType,
            statusTag: FlowStatusTag.pending,
            statusMeta: null,
            timeStarted: null,
            timeFinished: null,
            statusSummary: null,
            syncContext: { flowId: id }
        }
        return flowStatus
    }
}