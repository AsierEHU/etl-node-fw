## Introduction
ETL Node Framework is a tool focused on ETL best practices.

Observability by default:
- Traces / data lineage
- Events
- Metrics
- Documentation
- Testing

Tools for:
- Data quality / manage bad data
- Error handling

## Examples / how it works
- Defining DBs and Presenters
- Using Factories
- Interacting with (Flows, Steps, Adapters...)

## ETL Framework engines

- **Factories**: Create new runners by definition.
- **ETL Runners**: Expose process status and metrics. Perform pre and post Adapter running tasks.
- **ETL process**: Tranform a definition into a result. Return summaraized results (metrics, status).

## ETL Framework elements

- **Registers**: Data lineage, Manage bad data
- **Definitions**: Behaviour configuration. Acts like process documentation.
- **Adapters**: Manage registers, Manage bad data, Ensure data quality, Pull and push
- **Steps**: error handling
- **Flows**:

Interpreters overview

- LocalAdapterLoader
- LocalAdapterExtractor: 
- LocalAdapterTransformer
- LocalAdapterFlex
- LocalStep
- LocalFlow

Runners overview
- LocalAdapterRunner
- LocalStepRunner
- LocalFlowRunner



Extensibility [WIP]
- Include new desfinitions and runners
- Testing

Next features
- Process in batch (reducers)
- Tree flows (instead of lineal)
- Document store
- SQL store
    - Stage tables adapters
