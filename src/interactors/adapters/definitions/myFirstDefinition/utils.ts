import { Entity, Register, RegisterDataContext, RegisterStatusTag } from "../../../registers/types";
import { EntityWithMeta } from "../../types";
import { v4 as uuidv4 } from 'uuid';

export const getMockedRegisters = (inputEntities: any[], context: RegisterDataContext): Register<Entity>[] => {

    const inputEntitiesWithMeta = getInputFormat(inputEntities);

    return inputEntitiesWithMeta.map(inputEntity => {
        return {
            id: uuidv4(),
            entityType: "Mocked",
            sourceAbsoluteId: null,
            sourceRelativeId: null,
            statusTag: RegisterStatusTag.success,
            statusMeta: null,
            entity: inputEntity.entity,
            meta: inputEntity.meta,
            context,
        }
    })
}


export const getInputFormat = (inputEntities: any[]): EntityWithMeta<Entity>[] => {

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
