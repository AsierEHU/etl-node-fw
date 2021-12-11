import { EventEmitter } from "stream";
import { VolatileRegisterDataAccess } from "./dataAccess/volatile";
import { AdapterBuilder } from "./interactors/adapters/builder";
import { StepBuilder } from "./interactors/steps/builder";
import { testExtractor, testTransformer, testLoader } from "./interactors_implementation/adapters";
import { testStepExtractor, testStepLoader, testStepTransformer } from "./interactors_implementation/steps";

//Global dependencies
const presenter = new EventEmitter()

//Adapter dependencies
const adapterDefinitions = [testExtractor, testTransformer, testLoader];
const registerDataAccess = new VolatileRegisterDataAccess();
const adapterBuilder = new AdapterBuilder(adapterDefinitions)
const adapterDependencies = {
    adapterPresenter: presenter,
    registerDataAccess,
}

//Step dependencies
const stepDefinitions = [testStepExtractor, testStepLoader, testStepTransformer]
const stepBuilder = new StepBuilder(stepDefinitions)
const stepDependencies = {
    stepPresenter: presenter,
    adapterDependencies,
    adapterBuilder
}

//presenter options
presenter.on("adapterStatus", (adapterStatus) => {
    console.log(adapterStatus)
})
presenter.on("stepStatus", (stepStatus) => {
    console.log(stepStatus)
})


async function adapterExample() {

    const adapter1 = adapterBuilder.buildAdapter("testExtractor", adapterDependencies)
    await adapter1.start();

    const adapter2 = adapterBuilder.buildAdapter("testTransformer", adapterDependencies)
    await adapter2.start();

    const adapter3 = adapterBuilder.buildAdapter("testLoader", adapterDependencies)
    await adapter3.start();

    const registers = await registerDataAccess.getAll();

    console.log(registers)
}

async function stepExample() {

    const step1 = stepBuilder.buildStep("test1", stepDependencies);
    await step1.start()

    const step2 = stepBuilder.buildStep("test2", stepDependencies);
    await step2.start()

    const step3 = stepBuilder.buildStep("test3", stepDependencies);
    await step3.start()

    const registers = await registerDataAccess.getAll();

    console.log(registers)
}

// adapterExample()
stepExample()
