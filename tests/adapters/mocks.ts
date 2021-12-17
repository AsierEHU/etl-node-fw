import { localAdapterExtractorMocksSuite } from "./localAdapterExtractorMocks";
import { localAdapterTransformerMocksSuite } from "./localAdapterTranformerMocks";
import { localAdapterLoaderMocksSuite } from "./localAdapterLoaderMocks"
import { localAdapterFlexMocksSuite } from "./localAdapterFlexMocks";

export const adapterMocksSuites = [
    ...localAdapterExtractorMocksSuite,
    ...localAdapterTransformerMocksSuite,
    ...localAdapterLoaderMocksSuite,
    ...localAdapterFlexMocksSuite
]