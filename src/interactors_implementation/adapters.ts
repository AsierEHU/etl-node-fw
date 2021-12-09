import { MyAdapterConsumerDefinition, MyAdapterExtractorDefinition, MyAdapterTransformerDefinition, ToFixEntity, ValidationResult, ValidationStatusTag } from "../interactors/adapters/definitions/my_first_definition";


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



export const testExtractor: MyAdapterExtractorDefinition<inputClass> = {
    id: "testExtractor",
    definitionType: "MyAdapterExtractorDefinition",
    outputType: "inputClass",
    async entitiesGet(options: any) {
        const rawMockedInput = [{
            entity: {
                field: "Raw Object text",
                y: 23,
            },
            meta: "rawMocked"
        }];
        return rawMockedInput;
    },
    async entityValidate(entity: inputClass | null) {
        if (entity == null) {
            return {
                statusTag: ValidationStatusTag.invalid,
                meta: {
                    type: "null object",
                    action: "trigger alarm",
                    severity: "low"
                }
            };
        }
        else if (entity.y < 0) {
            return {
                statusTag: ValidationStatusTag.skipped,
                meta: {}
            };
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
            return {
                statusTag: ValidationStatusTag.valid,
                meta: {}
            };
        }
    },
    async entityFix(toFixEntity: ToFixEntity<inputClass>) {
        if (toFixEntity.validationMeta.type == "0 error") {
            const entity = toFixEntity.entity;
            if(!entity){
                return null;
            }
            entity.y = 1;
            return {
                entity,
                meta: {
                    note: "Fixed changing to 1"
                }
            };
        }
        else {
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
        return {
            text: entity.field,
            others: {
                x: entity.y,
            }
        };
    },
}

export const testConsumer: MyAdapterConsumerDefinition<outputClass, resultClass> = {
    id: "testConsumer",
    definitionType: "MyAdapterConsumerDefinition",
    inputType: "outputClass",
    outputType: "resultClass",
    async entityLoad(entity: outputClass | null) {
        return {
            success: true,
        } as resultClass;
    },
}