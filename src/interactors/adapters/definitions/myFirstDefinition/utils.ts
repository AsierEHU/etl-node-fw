import { Entity, Register, RegisterDataContext, RegisterStatusTag } from "../../../registers/types";
import { EntityWithMeta } from "../../types";
import { v4 as uuidv4 } from 'uuid';

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
