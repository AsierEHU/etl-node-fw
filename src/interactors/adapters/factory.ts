import { LocalAdapterExtractor } from "./definitions/localAdapterExtractor";
import { LocalAdapterFlex } from "./definitions/localAdapterFlex";
import { LocalAdapterLoader } from "./definitions/localAdapterLoader";
import { LocalAdapterTransformer } from "./definitions/localAdapterTransformer";
import { LocalAdapterRunner } from "./runners/localAdapterRunner";
import { Adapter, AdapterDefinition, AdapterRunner } from "./types";

export class AdapterFactory {
    private readonly adapterDefinitionsMap: { [key: string]: AdapterDefinition }

    constructor(adapterDefinitions: Array<AdapterDefinition>) {
        this.adapterDefinitionsMap = {}
        for (const adapterDefinition of adapterDefinitions) {
            if (this.adapterDefinitionsMap[adapterDefinition.id])
                throw new Error(`Adapter with id ${adapterDefinition.id} already exist`);
            this.adapterDefinitionsMap[adapterDefinition.id] = adapterDefinition
        }
    }

    public createAdapterDefinition(definitionId: string, dependencies: any): Adapter<AdapterDefinition> {
        const adapterDefinition = this.adapterDefinitionsMap[definitionId];
        if (!adapterDefinition) {
            throw Error("Not adapter match with definition id: " + definitionId)
        }

        const adapterDependencies = dependencies;
        adapterDependencies.adapterDefinition = adapterDefinition;

        if (adapterDefinition.definitionType == "LocalAdapterLoaderDefinition") {
            return new LocalAdapterLoader(adapterDependencies);
        }
        else if (adapterDefinition.definitionType == "LocalAdapterExtractorDefinition") {
            return new LocalAdapterExtractor(adapterDependencies);
        }
        else if (adapterDefinition.definitionType == "LocalAdapterTransformerDefinition") {
            return new LocalAdapterTransformer(adapterDependencies);
        }
        else if (adapterDefinition.definitionType == "LocalAdapterFlexDefinition") {
            return new LocalAdapterFlex(adapterDependencies);
        }
        else {
            throw Error("Not adapter match with definition type: " + adapterDefinition.definitionType)
        }
    }

    public createAdapterRunner(definitionId: string, dependencies: any): AdapterRunner {
        const adapterDefinition = this.adapterDefinitionsMap[definitionId];
        if (!adapterDefinition) {
            throw Error("Not adapter match with definition id: " + definitionId)
        }

        const adapterDependencies = dependencies;
        adapterDependencies.adapter = this.createAdapterDefinition(definitionId, dependencies);

        if (adapterDefinition.definitionType == "LocalAdapterLoaderDefinition") {
            return new LocalAdapterRunner(adapterDependencies);
        }
        else if (adapterDefinition.definitionType == "LocalAdapterExtractorDefinition") {
            return new LocalAdapterRunner(adapterDependencies);
        }
        else if (adapterDefinition.definitionType == "LocalAdapterTransformerDefinition") {
            return new LocalAdapterRunner(adapterDependencies);
        }
        else if (adapterDefinition.definitionType == "LocalAdapterFlexDefinition") {
            return new LocalAdapterRunner(adapterDependencies);
        }
        else {
            throw Error("Not adapter match with definition type: " + adapterDefinition.definitionType)
        }
    }

}

