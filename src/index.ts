import { EventEmitter } from "stream";
import { VolatileRegisterDataAccess } from "./dataAccess/volatile";
import { AdapterFactory } from "./interactors/adapters/factory";
import { StepFactory } from "./interactors/steps/factory";
import { testExtractor, testTransformer, testLoader } from "./interactors_implementation/adapters";
import { testStepExtractor, testStepLoader, testStepTransformer } from "./interactors_implementation/steps";

//Global dependencies
const presenter = new EventEmitter()

//Adapter dependencies
const adapterDefinitions = [testExtractor, testTransformer, testLoader];
const registerDataAccess = new VolatileRegisterDataAccess();
const adapterBuilder = new AdapterFactory(adapterDefinitions)
const adapterDependencies = {
    adapterPresenter: presenter,
    registerDataAccess,
}

//Step dependencies
const stepDefinitions = [testStepExtractor, testStepLoader, testStepTransformer]
const stepBuilder = new StepFactory(stepDefinitions)
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

    const adapter1 = adapterBuilder.createAdapter("testExtractor", adapterDependencies)
    await adapter1.start();

    const adapter2 = adapterBuilder.createAdapter("testTransformer", adapterDependencies)
    await adapter2.start();

    const adapter3 = adapterBuilder.createAdapter("testLoader", adapterDependencies)
    await adapter3.start();

    const registers = await registerDataAccess.getAll();

    console.log(registers)
}

async function stepExample() {

    const step1 = stepBuilder.createStep("test1", stepDependencies);
    await step1.start()

    const step2 = stepBuilder.createStep("test2", stepDependencies);
    await step2.start()

    const step3 = stepBuilder.createStep("test3", stepDependencies);
    await step3.start()

    const registers = await registerDataAccess.getAll();

    console.log(registers)
}

// adapterExample()
stepExample()
