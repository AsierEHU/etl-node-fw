import { Entity, RegisterDataAccess } from "../registers/types";
import { AdapterDependencies, MyConsumerAdapter, MyExtractorAdapter, MyFlexAdapter, MyTransformerAdapter } from "./definitions/my_first_definition";
import { Adapter, AdapterDefinition } from "./types";

export class AdapterBuilder {
    private readonly adapterDefinitionsMap: { [key: string]: AdapterDefinition }
    private readonly registerDataAccess: RegisterDataAccess<Entity>

    constructor(adapterDefinitions: Array<AdapterDefinition>, registerDataAccess: RegisterDataAccess<Entity>) {
        this.adapterDefinitionsMap = adapterDefinitions.reduce((map, adapterDefinition) => ({ ...map, [adapterDefinition.id]: adapterDefinition }), {})
        this.registerDataAccess = registerDataAccess
    }

    public buildAdapter(definitionId: string): Adapter<AdapterDefinition> {
        const adapterDefinition = this.adapterDefinitionsMap[definitionId];
        const adapterDependencies: AdapterDependencies<AdapterDefinition> = {
            adapterDefinition,
            registerDataAccess: this.registerDataAccess
        }

        if (adapterDefinition.definitionType == "MyAdapterConsumerDefinition") {
            return new MyConsumerAdapter(adapterDependencies);
        }
        else if (adapterDefinition.definitionType == "MyAdapterExtractorDefinition") {
            return new MyExtractorAdapter(adapterDependencies);
        }
        else if (adapterDefinition.definitionType == "MyAdapterTransformerDefinition") {
            return new MyTransformerAdapter(adapterDependencies);
        }
        else if (adapterDefinition.definitionType == "MyAdapterFlexDefinition") {
            return new MyFlexAdapter(adapterDependencies);
        }
        else {
            throw Error("Not adapter match with definition id: " + definitionId)
        }
    }
}

