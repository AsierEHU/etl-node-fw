import { LocalAdapterExtractor } from "./definitions/localAdapterExtractor";
import { LocalAdapterFlex } from "./definitions/localAdapterFlex";
import { LocalAdapterLoader } from "./definitions/localAdapterLoader";
import { LocalAdapterTransformer } from "./definitions/localAdapterTransformer";
import { LocalAdapterRunner } from "./runners/localAdapterRunner";
import { Adapter, AdapterDefinition, AdapterRunner } from "./types";


const ardt = {
    ["LocalAdapterRunner"]: {
        class: LocalAdapterRunner,
        dependencies: ["adapterPresenter", "registerDataAccess"],
    }
}

const addt = {
    ["LocalAdapterLoader"]: {
        class: LocalAdapterLoader,
        dependencies: ["registerDataAccess"],
        runner: ardt["LocalAdapterRunner"]
    },
    ["LocalAdapterExtractor"]: {
        class: LocalAdapterExtractor,
        dependencies: ["registerDataAccess"],
        runner: ardt["LocalAdapterRunner"]
    },
    ["LocalAdapterTransformer"]: {
        class: LocalAdapterTransformer,
        dependencies: ["registerDataAccess"],
        runner: ardt["LocalAdapterRunner"]
    },
    ["LocalAdapterFlex"]: {
        class: LocalAdapterFlex,
        dependencies: ["registerDataAccess"],
        runner: ardt["LocalAdapterRunner"]
    }
}

const AdapterDefinitionTree: { [key: string]: any } = {
    ["LocalAdapterLoaderDefinition"]: addt["LocalAdapterLoader"],
    ["LocalAdapterExtractorDefinition"]: addt["LocalAdapterExtractor"],
    ["LocalAdapterTransformerDefinition"]: addt["LocalAdapterTransformer"],
    ["LocalAdapterFlexDefinition"]: addt["LocalAdapterFlex"],
}

export class AdapterFactory {
    private readonly adapterDefinitionsMap: { [key: string]: AdapterDefinition }
    private readonly adapterGlobalDependencies: any

    constructor(adapterDefinitions: Array<AdapterDefinition>, dependencies: any) {
        this.adapterDefinitionsMap = {}
        for (const adapterDefinition of adapterDefinitions) {
            if (this.adapterDefinitionsMap[adapterDefinition.id])
                throw new Error(`Adapter with id ${adapterDefinition.id} already exist`);
            this.adapterDefinitionsMap[adapterDefinition.id] = adapterDefinition
        }
        this.adapterGlobalDependencies = dependencies
    }

    public createAdapter(definitionId: string): Adapter<AdapterDefinition> {
        const adapterDefinition = this.adapterDefinitionsMap[definitionId];
        if (!adapterDefinition) {
            throw Error("Not adapter match with definition id: " + definitionId)
        }

        const adapterDependencies = { ...this.adapterGlobalDependencies };
        adapterDependencies.adapterDefinition = adapterDefinition;

        const adapterDefinitionType = adapterDefinition.definitionType;
        const adapterBuildOptions = AdapterDefinitionTree[adapterDefinitionType];

        if (adapterBuildOptions) {
            return new adapterBuildOptions.class(adapterDependencies)
        }
        else {
            throw Error("Not adapter match with definition type: " + adapterDefinition.definitionType)
        }
    }

    public createAdapterRunner(definitionId: string): AdapterRunner {
        const adapterDefinition = this.adapterDefinitionsMap[definitionId];
        if (!adapterDefinition) {
            throw Error("Not adapter match with definition id: " + definitionId)
        }

        const adapterRunnerDependencies = { ...this.adapterGlobalDependencies };
        adapterRunnerDependencies.adapter = this.createAdapter(definitionId);

        const adapterDefinitionType = adapterDefinition.definitionType;
        const adapterRunnerBuildOptions = AdapterDefinitionTree[adapterDefinitionType].runner;

        if (adapterRunnerBuildOptions) {
            return new adapterRunnerBuildOptions.class(adapterRunnerDependencies)
        }
        else {
            throw Error("Not adapter match with definition type: " + adapterDefinition.definitionType)
        }
    }

}

