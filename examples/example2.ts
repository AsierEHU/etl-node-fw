import { AdapterFactory, AdapterPresenter, FlowFactory, FlowPresenter, InputEntity, LocalAdapterExtractorDefinition, LocalAdapterLoaderDefinition, LocalAdapterSetTransformerDefinition, LocalAdapterTransformerRowDefinition, LocalLinealFlowDefinition, LocalStepDefinition, RegisterStats, StepFactory, StepPresenter, ToFixEntity, ValidationResult, ValidationStatusTag, VolatileProcessStatusDataAccess, VolatileRegisterDataAccess } from 'etl-node-fw'
import EventEmitter from 'events'

/********************************
 * 4 Steps lineal flow example.
 ********************************/
// In this example we are going to download some entities from a two differents fake APIs.
// Then, aggregate data working with a Set step.
// Transform the aggregated data applying a sum to it's fields.
// Finally, load entities in our fakeDB


// Part 1
// Entities data types
// Define the data structures you are going to work on

type extractEntity1 = {
    field1: number,
    field2: number,
    match: string,
}

type extractEntity2 = {
    field3: number,
    match: string,
}

type transformEntity = {
    field4: number,
    match: string,
}

type loadEntity = {
    correctlyLoaded: boolean,
}


// Part 2
// Adapters definitions
// Define how to rule entities

function myFakeApiFetch1(): (extractEntity1 | null)[] {
    return [
        {
            field1: 24,
            field2: 23,
            match: "id1"
        },
        {
            field1: -1,
            field2: 3,
            match: "id2"
        },
    ]
}
function myFakeApiFetch2(): (extractEntity2 | null)[] {
    return [
        {
            field3: 6,
            match: "id1"
        },
        {
            field3: 9,
            match: "id2"
        },
    ]
}
function myFakeDBLoad(entity: transformEntity): boolean {
    return true
}

const extractor1Definition: LocalAdapterExtractorDefinition<extractEntity1> = {
    id: "extractEntity1Definition", //uniqe definition id
    definitionType: "LocalAdapterExtractorDefinition",
    outputType: "extractEntity1", //Entity type
    /**
     * Load entities into the flow as Registers
     * @param entityFetcher Tool for fetching Registers
     * @returns You can return a combination of raw entities or entities with meta (for extra information into the Register).
     */
    async entitiesGet(entityFetcher) {
        const extractedEntities = myFakeApiFetch1()
        return extractedEntities
    },
    /**
     * Apply validations to each entity. In this case, we will tag as valid all the entities
     * @param entity 
     * @returns 
     */
    async entityValidate(entity: extractEntity1 | null) {
        return ValidationStatusTag.valid;
    },
    /**
     * Sometimes you can apply instant fixes to Invalid entities.
     * In this case we won't apply any fix
     * @param toFixEntity 
     * @returns 
     */
    async entityFix(toFixEntity: ToFixEntity<extractEntity1>) {
        return null;
    },
}

const extractor2Definition: LocalAdapterExtractorDefinition<extractEntity2> = {
    id: "extractEntity2Definition", //uniqe definition id
    definitionType: "LocalAdapterExtractorDefinition",
    outputType: "extractEntity2", //Entity type
    /**
     * Load entities into the flow as Registers
     * @param entityFetcher Tool for fetching Registers
     * @returns You can return a combination of raw entities or entities with meta (for extra information into the Register).
     */
    async entitiesGet(entityFetcher) {
        const extractedEntities = myFakeApiFetch2()
        return extractedEntities
    },
    /**
     * Apply validations to each entity. In this case, we will tag as valid all the entities
     * @param entity 
     * @returns 
     */
    async entityValidate(entity: extractEntity2 | null) {
        return ValidationStatusTag.valid;
    },
    /**
     * Sometimes you can apply instant fixes to Invalid entities.
     * In this case we won't apply any fix
     * @param toFixEntity 
     * @returns 
     */
    async entityFix(toFixEntity: ToFixEntity<extractEntity2>) {
        return null;
    },
}

const setTransformerDefinition: LocalAdapterSetTransformerDefinition<transformEntity> = {
    id: "transformEntityDefinition",
    inputTypes: ["extractEntity1", "extractEntity2"],
    outputType: "transformEntity",
    definitionType: "LocalAdapterSetTransformerDefinition",
    /**
     * Make available to transform all successeded registers for the selected input types.
     * @param sets 
     */
    async setsProcess(sets: { [type: string]: object[] }): Promise<InputEntity<transformEntity>[]> {

        const extractEntity1Sets = sets["extractEntity1"] as extractEntity1[]
        const extractEntity2Sets = sets["extractEntity2"] as extractEntity2[]

        const outputEntities: transformEntity[] = extractEntity1Sets.map(e1 => {
            const e2 = extractEntity2Sets.find(e => e.match == e1.match) as extractEntity2
            return {
                field4: e1.field1 + e1.field2 + e2.field3,
                match: e1.match
            }
        })

        return outputEntities
    }
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

const extractor1StepDefinition: LocalStepDefinition = {
    id: "extract1StepDefinition", //uniqe definition id
    adapterDefinitionId: "extractEntity1Definition",
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

const extractor2StepDefinition: LocalStepDefinition = {
    id: "extract2StepDefinition", //uniqe definition id
    adapterDefinitionId: "extractEntity2Definition",
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
        { id: "extract1StepDefinition", successMandatory: true },
        { id: "extract2StepDefinition", successMandatory: true },
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
const adapterDefinitions = [extractor1Definition, extractor2Definition, setTransformerDefinition, loaderDefinition]
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
const stepDefinitions = [extractor1StepDefinition, extractor2StepDefinition, transformerStepDefinition, loaderStepDefinition]
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
    await flowRunner.run()

    const registers = await registerDataAccess.getAll()
    console.log(registers)
    //9 Registers (4 extracted, 1 special set register, 2 transformed, 2 loaded)

    const processesStatus = await processStatusDataAccess.getAll()
    console.log(processesStatus)
    //9 entries: 'testFlow1,'extract1StepDefinition','extractEntity1Definition','extract2StepDefinition','extractEntity2Definition',
    // 'transformStepDefinition',''transformEntityDefinition','loadStepDefinition','loadEntityDefinition'
}
run()