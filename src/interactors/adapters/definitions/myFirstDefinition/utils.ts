import { Entity, Register, RegisterStatusTag } from "../../../registers/types";
import { AdapterStatusSummary, EntityWithMeta } from "../../types";

export const getWithMetaFormat = (inputEntities: any[]): EntityWithMeta<Entity>[] => {

    return inputEntities.map(inputEntity => {
        if (inputEntity?.entity && inputEntity?.meta) {
            return inputEntity;

        }
        else if (inputEntity) {
            return {
                entity: inputEntity,
                meta: null,
            }
        }
        else {
            return {
                entity: null,
                meta: null,
            }
        }
    })
}

export const calculateSummary = (outputRegisters: Register<Entity>[]): AdapterStatusSummary => {
    const statusSummary = {
        output_rows: outputRegisters.length,
        rows_success: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.success).length,
        rows_failed: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.failed).length,
        rows_invalid: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.invalid).length,
        rows_skipped: outputRegisters.filter(register => register.statusTag == RegisterStatusTag.skipped).length,
    };
    return statusSummary;
}
