import { VolatileRegisterDataAccess } from "./dataAccess/volatile";
import { AdapterBuilder } from "./interactors/adapters/builder";
import { testExtractor, testTransformer, testConsumer } from "./interactors_implementation/adapters";


//Adapter example

async function adapterExample(){
    const registerDataAccess = new VolatileRegisterDataAccess();
    const adapterDefinitions = [testExtractor, testTransformer, testConsumer];

    const adapterBuilder = new AdapterBuilder(adapterDefinitions, registerDataAccess)
    
    const adapter1 = adapterBuilder.buildAdapter("testExtractor")
    await adapter1.start();
    
    const adapter2 = adapterBuilder.buildAdapter("testTransformer")
    await adapter2.start();
    
    const adapter3 = adapterBuilder.buildAdapter("testConsumer")
    await adapter3.start();

    const registers = await registerDataAccess.getAll();
    console.log(registers)
}

adapterExample()

