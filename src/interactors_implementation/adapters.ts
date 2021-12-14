import { MyAdapterExtractorDefinition, MyAdapterFlexDefinition, MyAdapterLoaderDefinition, MyAdapterTransformerDefinition } from "../interactors/adapters/definitions/myFirstDefinition/my_first_definition";
import { RegisterDataAccess, RegisterDataFilter, ToFixEntity, ValidationStatusTag } from "../interactors/adapters/definitions/myFirstDefinition/types";
import { Entity, RegisterDataContext } from "../interactors/registers/types";


type inputClass = {
    field: string,
    y: number,
}

type outputClass = {
    text: string,
    others: {
        x: number,
    }
}

type resultClass = {
    success: boolean,
}

type result2Class = {
    successTotal: number
}



export const testExtractor: MyAdapterExtractorDefinition<inputClass> = {
    id: "testExtractor",
    definitionType: "MyAdapterExtractorDefinition",
    outputType: "inputClass",
    async entitiesGet() {
        const rawMockedInput = [
            {
                entity: {
                    field: "Raw Object text",
                    y: 23,
                },
                meta: "rawMocked to success"
            },
            null,
            {
                field: "Raw Object text 2",
                y: 0,
            },
            {
                entity: {
                    field: "Raw Object text 3",
                    y: -34,
                },
                meta: "rawMocked to skip"
            },
            {
                entity: {
                    field: "Raw Object text 3",
                    y: 30,
                },
                meta: "rawMocked to fail"
            }
        ];
        return rawMockedInput;
    },
    async entityValidate(entity: inputClass | null) {
        if (entity == null) {
            return {
                statusTag: ValidationStatusTag.invalid,
                meta: {
                    type: "null object",
                    action: "trigger alarm",
                    severity: "high"
                }
            };
        }
        else if (entity.y < 0) {
            return ValidationStatusTag.skipped;
        }
        else if (entity.y == 0) {
            return {
                statusTag: ValidationStatusTag.invalid,
                meta: {
                    type: "0 error",
                    action: "trigger alarm",
                    severity: "low"
                }
            };
        }
        else {
            return ValidationStatusTag.valid;
        }
    },
    async entityFix(toFixEntity: ToFixEntity<inputClass>) {
        const entity = toFixEntity.entity;
        if (!entity) {
            return null;
        }
        else if (toFixEntity.validationMeta.type == "0 error") {
            entity.y = 1;
            return {
                entity,
                meta: {
                    note: "Fixed changing to 1"
                }
            };
        } else {
            return null;
        }
    },
}

export const testTransformer: MyAdapterTransformerDefinition<inputClass, outputClass> = {
    id: "testTransformer",
    definitionType: "MyAdapterTransformerDefinition",
    inputType: "inputClass",
    outputType: "outputClass",
    async entityProcess(entity: inputClass) {
        if (entity.y == 30) {
            throw new Error("Y 30 error!!")
        }
        return {
            text: entity.field,
            others: {
                x: entity.y,
            }
        };
    },
}

export const testLoader: MyAdapterLoaderDefinition<outputClass, resultClass> = {
    id: "testLoader",
    definitionType: "MyAdapterLoaderDefinition",
    inputType: "outputClass",
    outputType: "resultClass",
    async entityLoad(entity: outputClass | null) {
        return {
            success: true,
        } as resultClass;
    },
}

export const testFlex: MyAdapterFlexDefinition<result2Class> = {
    id: "testFlex",
    outputType: "result2Class",
    definitionType: "MyAdapterFlexDefinition",
    async entitiesGet(registerDataAccess: RegisterDataAccess<Entity>, syncContext: RegisterDataContext) {
        const filter: RegisterDataFilter = {
            flowId: syncContext.flowId,
            registerType: "resultClass"
        }
        const registers = await registerDataAccess.getAll(filter)
        const entities = registers.map(reg => reg.entity)
        return [{
            successTotal: entities.length
        }]
    }
}