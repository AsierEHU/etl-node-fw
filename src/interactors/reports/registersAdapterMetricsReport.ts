import { RegisterStatusTag } from "../../business/register";
import { RegisterDataAccess } from "../common/registers";
import { RegisterStats } from "./types";


export class RegistersAdapterMetricsReport {

    private readonly registerDataAccess: RegisterDataAccess

    constructor(dependencies: any) {
        this.registerDataAccess = dependencies.registerDataAccess
    }

    async getReport(adapterId: string): Promise<RegisterStats> {
        const outputRegisters = await this.registerDataAccess.getAll({ adapterId, excludeOptions: { excludeReservedEntityTypes: true, excludeEntityPayload: true } })
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
