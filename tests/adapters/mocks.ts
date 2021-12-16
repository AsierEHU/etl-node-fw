import { localAdapterExtractorMocksSuite } from "./localAdapterExtractorMocks";
import { localAdapterTransformerMocksSuite } from "./localAdapterTranformerMocks";
import { localAdapterLoaderMocksSuite } from "./localAdapterLoaderMocks"
import { localAdapterFlexMocksSuite } from "./lcoalAdapterFlexMocks";

export const adapterMocksSuites = [
    ...localAdapterExtractorMocksSuite,
    ...localAdapterTransformerMocksSuite,
    ...localAdapterLoaderMocksSuite,
    ...localAdapterFlexMocksSuite
]