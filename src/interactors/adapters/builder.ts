import { MyConsumerAdapter, MyExtractorAdapter, MyFlexAdapter, MyTransformerAdapter } from "./definitions/my_first_definition";
import { Adapter, AdapterDefinition } from "./types";

export class AdapterBuilder {
    private readonly adapterDefinitionsMap: { [key: string]: AdapterDefinition }

    constructor(adapterDefinitions: Array<AdapterDefinition>) {
        this.adapterDefinitionsMap = adapterDefinitions.reduce((map, adapterDefinition) => ({ ...map, [adapterDefinition.id]: adapterDefinition }), {})
    }

    public buildAdapter(definitionId: string, dependencies: any): Adapter<AdapterDefinition> {
        const adapterDefinition = this.adapterDefinitionsMap[definitionId];
        const adapterDependencies = dependencies;
        adapterDependencies.adapterDefinition = adapterDefinition;

        if (adapterDefinition.definitionType == "MyAdapterLoaderDefinition") {
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

