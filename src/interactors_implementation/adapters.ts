import {MyAdapterConsumerDefinition, MyAdapterExtractorDefinition, MyAdapterTransformerDefinition, ToFixEntity, ValidationResult, ValidationStatusTag } from "../interactors/adapters/definitions/my_first_definition";


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



export const adapter1Definition: MyAdapterExtractorDefinition<inputClass> = {
    id: "adapter1Definition",
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
    async entityValidate(entity: inputClass) {
        if (entity.y < 0) {
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
        if (toFixEntity.validationResult.meta.type == "0 error") {
            const entity = toFixEntity.entity;
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

export const adapter2Definition: MyAdapterTransformerDefinition<inputClass, outputClass> = {
    id: "adapter2Definition",
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

export const adapter3Definition: MyAdapterConsumerDefinition<outputClass, resultClass> = {
    id: "adapter3Definition",
    definitionType: "MyAdapterConsumerDefinition",
    inputType: "outputClass",
    outputType: "resultClass",
    async entityLoad(entity: outputClass) {
        return {
            success: true,
        } as resultClass;
    },
}