import { localAdapterExtractorMocks } from "./localAdapterExtractorMocks";
import { localAdapterTransformerMocks } from "./localAdapterRowTranformerMocks";
import { localAdapterLoaderMocks } from "./localAdapterLoaderMocks"
import { localAdapterFlexMocks } from "./localAdapterSetTransformerMocks";

export const adapterMocks = [
    ...localAdapterExtractorMocks,
    ...localAdapterTransformerMocks,
    ...localAdapterLoaderMocks,
    ...localAdapterFlexMocks
]