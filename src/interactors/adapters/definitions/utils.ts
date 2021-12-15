import { Entity, Register, RegisterStatusTag } from "../../registers/types";
import { AdapterStatusSummary, EntityWithMeta, InputEntity } from "../types";

export const getWithMetaFormat = (inputEntities: InputEntity<any>[]): EntityWithMeta<Entity>[] => {

    return inputEntities.map(inputEntity => {
        if (inputEntity?.entity) {
            const entity = {
                entity: inputEntity?.entity,
                meta: inputEntity?.meta || null,
                status: inputEntity?.status
            }
            return entity as EntityWithMeta<Entity>;
        }
        else if (inputEntity) {
            return {
                entity: inputEntity,
                meta: null
            } as EntityWithMeta<Entity>;
        }
        else {
            return {
                entity: null,
                meta: null
            } as EntityWithMeta<Entity>;
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
