## Introduction
ETL Node Framework is a tool focused on ETL best practices.

Observability by default:
- Data lineage
- Events
- Metrics
- Documentation
- Testing

Tools for:
- Ensuring data quality
- Managing bad data
- Error handling
## ETL Framework concepts
### Entities
Input and Ouput raw payload. The information that you want to Extract, Transform and Load.
### Registers
Meta information about the entities after being processed.
Keep Sync context, data lineage and process status data.
Tag the entities type.

Special entity reserved [$]types Tags:
- $entityPushed: Used for working with entities in "Push mode"
- $extractorConfig: Used for define Extractors configuration

Source data lineage types:
- Row ["v4UUID"]: When the source entity is from a single row
- Set ["set-(setRegisterType)-..."]: When the source entity is from one or more sets
### Adapters
Run the Definition about how to ETL entities.
Each adapter produce only one Entity type.
Forces to implement some validations to ensure data quality, error prevention and decisions about how to manage bad data.
Can Work in "Push" or "Pull" modes.
- "Pull Mode" (default): Adapter is in charge of obtain the input entities. 
- "Push Mode": Adapter only obtain previously loaded entities.

Types:
- **Extractors**: Input new entities into the flow.
- **Transformers**: Create new entities from existing entities.
    - Row: Unique Row source needed for the output
    - Set: One or more Sets of data needed for the output
- **Loaders**: Save entities into the final storage. Save ouput resuls.
### Steps
Define how an Adapter must be ran in an specific Flow.
Implements some error handling tools like retries and force to define how the flow must continue in case of not success.
### Flows
Define the order execution and dependencies between steps.
## ETL Framework patterns
- **Definitions**: Behaviour configuration. Acts like process documentation.
- **Processes**: Tranform a definition into a result. Return summaraized results (monitoring).
- **Runners**: Run Processes exposing their status, errors and metrics.
- **Factories**: Create new runners by definition.
- **DataAccess**: Interface for handling Entities and Registers
- **presenters**: Event channels with Status and Errors information.
## Examples / how it works [WIP]
- Implementing DBs and Presenters
- Implementing Definitions
- Using Factories
- Interacting with (ETL Runners)
## Default implementations overview [WIP]
### Adapters
- LocalAdapter family: For small sets running in one local computer
    - LocalAdapterExtractor
    - LocalAdapterRowTransformer
    - LocalAdapterSetTransformer
    - LocalAdapterLoader
- LocalAdapterRunner
### Steps
- LocalStep
- LocalStepRunner
### Flows
- LocalLinealFlow
- LocalFlowRunner
## Extensibility [WIP]
- Developing own ETL Elements
- Testing
## Next features [WIP]
- Process in batch (reducers)
- Tree flows (instead of lineal)
- Document store
- SQL store
- Stage tables adapters
