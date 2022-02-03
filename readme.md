## Installation
```bash
npm install etl-node-fw
```
## Introduction
ETL Node Framework is a tool focused on ETL best practices.

Observability by default:
- Data lineage
- Traces
- Events
- Metrics
- Documentation
- Testing

Tools for:
- Ensuring data quality
- Managing bad data
- Error handling
---
## ETL Framework concepts
### Entities
Input and Ouput raw payload. The information that you want to Extract, Transform and Load.
### Registers
Meta information about the entities after being processed.
Keep Sync context, data lineage and process status data.
### Adapters
Run the Definition about how to ETL entities.
Each adapter produce only one Entity type.
Can force to implement some validations to ensure data quality, error prevention and decisions about how to manage bad data.
Can Work in "Push" or "Pull" modes.
- "Pull Mode" (default): Adapter is in charge of obtain the input entities. 
- "Push Mode": Adapter only obtain previously loaded entities. Used special reserved [$]AdapterId: $pushEntity

Types:
- **Extractors**: Input new entities into the flow.
- **Transformers**: Create new entities from existing entities.
    - Row: Unique Row source needed for the output
    - Set: One or more Sets of data needed for the output
- **Loaders**: Save entities into the final storage. Save ouput resuls.
### Steps
Define how an Adapter must be ran in an specific Flow.
Can run adapters in "Push" and "Pull" mode.
Implements some error handling tools like retries and force to define how the flow must continue in case of not success.
### Flows
Define the order execution and dependencies between steps.

---
## ETL Framework patterns
- **Definitions**: Behaviour configuration. Acts like process documentation.
- **Processes**: Tranform a definition into a result. Return summaraized results (monitoring).
- **Runners**: Run Processes exposing their status changes, errors and metrics.
- **Factories**: Create new runners by definition.
- **DataAccess**: Interface for handling Entities and Registers
- **presenters**: Event channels with Status and Errors information.
---
## Examples / how it works
See [examples](https://github.com/AsierEHU/etl-node-fw/tree/master/examples) folder.

---
## Reference [WIP]
### Architecture
![Architecture](https://github.com/AsierEHU/etl-node-fw/blob/master/doc/Architecture.svg?raw=true)
### Flow Example
![Flow Example](https://github.com/AsierEHU/etl-node-fw/blob/master/doc/FlowExample.svg?raw=true)
### Register data structure
``` ts
{
    id: string //unique identifier
    entityType: string 
    sourceRelativeId: string | null //relative (last register source) datalineage
    sourceAbsoluteId: string | null //absolute (first register source) datalineage
    sourceEntityId: string | null //user custom datalineage
    statusTag: RegisterStatusTag 
    //- pending: register pending to be proccessed,
    //- success: register saved with success result -> not errors, validations passed,
    //- failed: register saved with failed result -> unexpected/software error,
    //- invalid: register saved with invalid result -> validation not passed,
    //- skipped: register saved with skipped result -> tagged as not necessary by definition,
    statusMeta: RegisterMeta //extra info about the register status
    entity: object | null, //entity
    meta: RegisterMeta, //user custom meta
    date: Date, //creation date
    definitionId: string //definition  trace
    syncContext: SyncContext //process traces (flowId,stepId,AdapterId)
}
```
Special entityType reserved:
- $flowConfig: Used for define Flow configuration
- $setRegister: Used for define a Set of registers

### Status data structure
Adapter, Step or Flow process status entry.
``` ts
{
    id: string //process unique identifier
    definitionId: string //definition identifier
    statusTag: ProcessStatus
    //- pending: process pending to be proccessed,
    //- success: process finished with success result -> not software exceptions
    //- failed: process finished with exceptions
    //- invalid: process tagged invalid by definition
    statusMeta: //extra info about the process status
    timeStarted: Date | null
    timeFinished: Date | null
    runOptions: any //process input params
    syncContext: SyncContext //process traces (flowId,stepId,AdapterId)
    processType: ProcessType //flow,step,adapter
}
```
### Presenter data structure
Adapter, Step or Flow process status event.
``` ts
{
    id: string //process unique identifier
    definitionId: string //definition identifier
    definitionType: string //definition type
    outputType: string //process output entity type
    statusTag: ProcessStatus
    //- pending: process pending to be proccessed,
    //- success: process finished with success result -> not software exceptions
    //- failed: process finished with exceptions
    //- invalid: process tagged invalid by definition
    statusMeta: //extra info about the process status
    timeStarted: Date | null
    timeFinished: Date | null
    statusSummary: any, //metrics about the process
    runOptions: any //process input params
    syncContext: SyncContext //process traces (flowId,stepId,AdapterId)
}
```
---
## Observability
### Registers DataLineage
![DataLineage](https://github.com/AsierEHU/etl-node-fw/blob/master/doc/DataLineage.svg?raw=true)
### Registers reporting
![Reporting Registers](https://github.com/AsierEHU/etl-node-fw/blob/master/doc/ReportingRegisters.svg?raw=true)
### Processes reporting
![Reporting Processes](https://github.com/AsierEHU/etl-node-fw/blob/master/doc/ReportingProcesses.svg?raw=true)

---
## Default implementations overview
### Adapters
- **LocalAdapter family**: For small sets running in one local computer
    - **LocalAdapterExtractor**: Enforce data quality and error prevention applying validators. Can apply automatic clean-up actions or tagging as "invalid" records for triage.
    - **LocalAdapterRowTransformer**: Row by row transformation.
    - **LocalAdapterSetTransformer**: Sets to rows transformation.
    - **LocalAdapterLoader**: Apply output validations to check entities has been loaded correctly.
- **LocalAdapterRunner**: Check status for local adapters. Set "failed" status in case of any adapter (not register) exception thrown.
    - "adapterStatus" channel: for status change events.
    - "adapterError" channel: for exceptions raised.
### Steps
- **LocalStep**: Retries config for failed Records and Adapters. Can define invalid status depending on the final records summary defined in the definition config.
- **LocalStepRunner**: Check status for local steps. Sets "failed" status in case of any step exception thrown. Sets "invalid" status in case of definition invalid exception.
    - "stepStatus" channel: for status change events.
    - "stepError" channel: for exceptions raised.
### Flows
- **LocalLinealFlow**: Run steps one by one in the defined order. Can force tu use specific params in each Step, and apply an error response behavior depending of the Step sucssesfullness.
- **LocalLinealFlowRunner**: Check status for local flows. Sets "failed" status in case of any flow exception thrown. Flow finishing with pending for run steps will be considered an exception and tagged wit status "failed". 
    - "flowStatus" channel: for status change events.
    - "flowError" channel: for exceptions raised.
---
## Extensibility [WIP]
- Developing own ETL Elements
- Testing
---
## Next features
- Reporting Tool
- Continue process from last state
- Reference DOC
- Document store
- SQL store
- Stage tables adapters
- Process in batch (reducers)
- Tree flows (instead of lineal)


