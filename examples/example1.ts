import { AdapterFactory, AdapterPresenter, FlowFactory, FlowPresenter, LocalAdapterExtractorDefinition, LocalAdapterLoaderDefinition, LocalAdapterTransformerRowDefinition, LocalLinealFlowDefinition, LocalStepDefinition, RegisterStats, StepFactory, StepPresenter, ToFixEntity, ValidationResult, ValidationStatusTag, VolatileProcessStatusDataAccess, VolatileRegisterDataAccess } from 'etl-node-fw'
import EventEmitter from 'events'

/********************************
 * 3 Steps lineal flow example.
 ********************************/
// In this example we are going to download some entities from a fake API.
// Then, sum their fields.
// Finally, load entities in our fakeDB


// Part 1
// Entities data types
// Define the data structures you are going to work on

type flowConfig = {
    apiCallConfig: any
}

type extractEntity = {
    field1: number,
    field2: number,
}

type transformEntity = {
    field3: number,
}

type loadEntity = {
    correctlyLoaded: boolean,
}


// Part 2
// Adapters definitions
// Define how to rule entities

function myFakeApiFetch(apiCallConfig: any): (extractEntity | null)[] {
    return [
        {
            field1: 24,
            field2: 23,
        },
        null,
        {
            field1: -1,
            field2: 3,
        },
    ]
}
function myFakeDBLoad(entity: transformEntity): boolean {
    return true
}

const extractorDefinition: LocalAdapterExtractorDefinition<extractEntity> = {
    id: "extractEntityDefinition", //uniqe definition id
    definitionType: "LocalAdapterExtractorDefinition",
    outputType: "extractEntity", //Entity type
    /**
     * Load entities into the flow as Registers
     * @param entityFetcher Tool for fetching Registers
     * @returns You can return a combination of raw entities or entities with meta (for extra information into the Register).
     */
    async entitiesGet(entityFetcher) {
        const flowConfig: flowConfig = await entityFetcher.getFlowConfig()
        const extractedEntities = myFakeApiFetch(flowConfig.apiCallConfig)
        const extractedEntitiesWithMeta = extractedEntities.map((extractedEntity, index) => {
            return {
                $entity: extractedEntity,
                $meta: "Example entity",
                $id: "myIndexedId" + index
            }
        })
        return extractedEntitiesWithMeta
    },
    /**
     * Apply validations to each entity
     * @param entity 
     * @returns 
     */
    async entityValidate(entity: extractEntity | null) {
        if (entity == null) {
            return {
                statusTag: ValidationStatusTag.invalid,
                meta: {
                    type: "null object",
                }
            };
        }
        else if (entity.field1 == -1) {
            return ValidationStatusTag.invalid;
        }
        else {
            return ValidationStatusTag.valid;
        }
    },
    /**
     * Sometimes you can apply instant fixes to Invalid entities
     * @param toFixEntity 
     * @returns 
     */
    async entityFix(toFixEntity: ToFixEntity<extractEntity>) {
        const entity = toFixEntity.entity;
        if (!entity) {
            return null;
        }
        else if (entity.field1 == -1) {
            entity.field1 = 0
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

const transformerDefinition: LocalAdapterTransformerRowDefinition<extractEntity, transformEntity> = {
    id: "transformEntityDefinition",
    definitionType: "LocalAdapterTransformerRowDefinition",
    inputType: "extractEntity",
    outputType: "transformEntity",
    async entityProcess(entity: extractEntity) {
        return {
            field3: entity.field1 + entity.field2
        }
    },
}

const loaderDefinition: LocalAdapterLoaderDefinition<transformEntity, loadEntity> = {
    id: "loadEntityDefinition",
    definitionType: "LocalAdapterLoaderDefinition",
    inputType: "transformEntity",
    outputType: "loadEntity",
    async entityLoad(entity: transformEntity) {
        return {
            correctlyLoaded: myFakeDBLoad(entity)
        }
    },
    /**
     * Once you have the api result, you can validate
     * @param inputEntity 
     * @returns 
     */
    async entityValidate(inputEntity: loadEntity | null): Promise<ValidationResult | ValidationStatusTag> {
        if (inputEntity?.correctlyLoaded == true) {
            return ValidationStatusTag.valid
        } else {
            return ValidationStatusTag.invalid
        }
    }
}

// Part 3
// Step definition
// Define how to run an adapter in a flow

const extractorStepDefinition: LocalStepDefinition = {
    id: "extractStepDefinition", //uniqe definition id
    adapterDefinitionId: "extractEntityDefinition",
    maxRetries: 0, //In case of Adapter fails or any Register Fails, the number of retries
    definitionType: "LocalStepDefinition",
    /**
     * Sometimes you need to tag an step as invalid, for example, if you get 0 entities, it is a 'success' result but is not Valid for your business.
     * @param statusSummary 
     * @returns 
     */
    isInvalidRegistersSummary: function (statusSummary: RegisterStats): boolean {
        return false
    },
    adapterRunOptions: null //Force to run adapter with specified params
}

const transformerStepDefinition: LocalStepDefinition = {
    id: "transformStepDefinition", //uniqe definition id
    adapterDefinitionId: "transformEntityDefinition",
    maxRetries: 1, //In case of Adapter fails or any Register Fails, the number of retries
    definitionType: "LocalStepDefinition",
    /**
     * Sometimes you need to tag an step as invalid, for example, if you get 0 entities, it is a 'success' result but is not Valid for your business.
     * @param statusSummary 
     * @returns 
     */
    isInvalidRegistersSummary: function (statusSummary: RegisterStats): boolean {
        return false
    },
    adapterRunOptions: null //Force to run adapter with specified params
}

const loaderStepDefinition: LocalStepDefinition = {
    id: "loadStepDefinition", //uniqe definition id
    adapterDefinitionId: "loadEntityDefinition",
    maxRetries: 3, //In case of Adapter fails or any Register Fails, the number of retries
    definitionType: "LocalStepDefinition",
    /**
     * Sometimes you need to tag an step as invalid, for example, if you get 0 entities, it is a 'success' result but is not Valid for your business.
     * @param statusSummary 
     * @returns 
     */
    isInvalidRegistersSummary: function (statusSummary: RegisterStats): boolean {
        return false
    },
    adapterRunOptions: null //Force to run adapter with specified params
}

// Part 4
// Flow definition
// Define run order

const testFlow1Definition: LocalLinealFlowDefinition = {
    id: "testFlow1", //uniqe definition id
    definitionType: "LocalLinealFlowDefinition",
    stepsDefinitionFlow: [
        { id: "extractStepDefinition", successMandatory: true },
        { id: "transformStepDefinition", successMandatory: true },
        { id: "loadStepDefinition", successMandatory: true }
    ] //Steps run order. Use successMandatory if you want to stop the flow ("failed") in case of not step "success" result.
}

// Part 5
//  DataAccess, Presenters and Factories
// All the configurations and classes you need to plugin

const presenter = new EventEmitter()
const registerDataAccess = new VolatileRegisterDataAccess()
const processStatusDataAccess = new VolatileProcessStatusDataAccess()

//Adapter dependencies
presenter.on("adapterStatus", (adapterStatus: AdapterPresenter) => {
    console.log(adapterStatus)
})
presenter.on("adapterError", (adapterError) => {
    console.error(adapterError)
})
const adapterDependencies = {
    adapterPresenter: presenter,
    registerDataAccess,
    processStatusDataAccess
}
const adapterDefinitions = [extractorDefinition, transformerDefinition, loaderDefinition]
const adapterFactory = new AdapterFactory(adapterDefinitions, adapterDependencies)

//Step dependencies
presenter.on("stepStatus", (stepStatus: StepPresenter) => {
    console.log(stepStatus)
})
presenter.on("stepError", (stepError) => {
    console.error(stepError)
})
const stepDependencies = {
    stepPresenter: presenter,
    registerDataAccess: registerDataAccess,
    processStatusDataAccess,
    adapterFactory
}
const stepDefinitions = [extractorStepDefinition, transformerStepDefinition, loaderStepDefinition]
const stepFactory = new StepFactory(stepDefinitions, stepDependencies)

//Flow dependencies
presenter.on("flowStatus", (flowStatus: FlowPresenter) => {
    console.log(flowStatus)
})
presenter.on("flowError", (flowError) => {
    console.error(flowError)
})
const flowDependencies = {
    flowPresenter: presenter,
    registerDataAccess,
    processStatusDataAccess,
    stepFactory
}
const flowDefinitions = [testFlow1Definition]
const flowFactory = new FlowFactory(flowDefinitions, flowDependencies)

// Part 6
// Run
//You can run an Adapter, an Step or a Flow independently.
//In this example, we run a Flow
async function run() {
    const flowRunner = flowFactory.createFlowRunner("testFlow1")
    await flowRunner.run({
        flowConfig: {
            apiCallConfig: "testConfig"
        }
    })

    const registers = await registerDataAccess.getAll()
    console.log(registers)
    //8 Registers (1 flowConfig, 3 extracted, 2 transformed, 2 loaded)

    const processesStatus = await processStatusDataAccess.getAll()
    console.log(processesStatus)
    //7 entries: 'testFlow1,'extractStepDefinition','extractEntityDefinition',
    // 'transformStepDefinition',''transformEntityDefinition','loadStepDefinition','loadEntityDefinition'
}
run()