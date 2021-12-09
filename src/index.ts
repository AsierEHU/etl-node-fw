import { VolatileRegisterDataAccess } from "./dataAccess/volatile";
import { AdapterBuilder } from "./interactors/adapters/builder";
import { adapter1Definition, adapter2Definition, adapter3Definition } from "./interactors_implementation/adapters";


//Adapter example

async function adapterExample(){
    const registerDataAccess = new VolatileRegisterDataAccess();
    const adapterDefinitions = [adapter1Definition, adapter2Definition, adapter3Definition];

    const adapterBuilder = new AdapterBuilder(adapterDefinitions, registerDataAccess)
    
    const adapter1 = adapterBuilder.buildAdapter("adapter1Definition")
    await adapter1.start();
    
    const adapter2 = adapterBuilder.buildAdapter("adapter2Definition")
    await adapter2.start();
    
    const adapter3 = adapterBuilder.buildAdapter("adapter3Definition")
    await adapter3.start();

    const registers = await registerDataAccess.getAll();
    console.log(registers)
}

adapterExample()

