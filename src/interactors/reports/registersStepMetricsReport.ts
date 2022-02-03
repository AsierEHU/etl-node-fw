import { uniqBy } from "lodash"
import { RegisterStatusTag } from "../../business/register";
import { RegisterDataAccess } from "../common/registers";
import { RegisterStats } from "./types";


export class RegistersStepMetricsReport {

    private readonly registerDataAccess: RegisterDataAccess

    constructor(dependencies: any) {
        this.registerDataAccess = dependencies.registerDataAccess
    }

    async getReport(stepId: string, excludeFailedRetries: boolean = false): Promise<RegisterStats> {
        let outputRegisters = await this.registerDataAccess.getAll({ stepId, excludeOptions: { excludeReservedEntityTypes: true, excludeEntityPayload: true } })

        if (excludeFailedRetries) {
            const failedRegisters = await this.registerDataAccess.getAll({ stepId, registerStatus: RegisterStatusTag.failed, excludeOptions: { excludeEntityPayload: true } })
            const uniquefailedRegisters = uniqBy(failedRegisters, "sourceRelativeId")
            outputRegisters = outputRegisters.filter(register => register.statusTag != RegisterStatusTag.failed)
            outputRegisters = [...outputRegisters, ...uniquefailedRegisters]
        }

        const statusSummary = {
            registers_total: outputRegisters.length,
            registers_success: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.success).length,
            registers_failed: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.failed).length,
            registers_invalid: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.invalid).length,
            registers_skipped: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.skipped).length,
        };

        return statusSummary;
    }
}
