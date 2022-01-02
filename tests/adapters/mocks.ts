import { localAdapterExtractorMocks } from "./localAdapterExtractorMocks";
import { localAdapterTransformerMocks } from "./localAdapterTranformerMocks";
import { localAdapterLoaderMocks } from "./localAdapterLoaderMocks"
import { localAdapterFlexMocks } from "./localAdapterFlexMocks";

export const adapterMocks = [
    ...localAdapterExtractorMocks,
    ...localAdapterTransformerMocks,
    ...localAdapterLoaderMocks,
    ...localAdapterFlexMocks
]