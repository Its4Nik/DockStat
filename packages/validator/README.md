# @dockstat/validator

This is an experimental library used for request validation frontends like ElysiaJS using a native rust validator and a thin typescript wrapper around the `Bun:ffi` interface(s). 

The rust source code can be found in [`./native/src`](./native/src) and a deeper Rust focused Readme in [`./native`](./native).

> This is a `Bun` based library, node is not tested/supported!

## Get started

Install the library using Bun:

```bash
bun install @dockstat/validator
```

Available exports:

|import|Description|Typing|
|-|-|-|
|`import {v} from "@dockstat/validator"`|Barrel export of all available typings|`v: Record<SchemaType,(...) => void>`|
|`import {validateSchema} from "@dockstat/validator"`|Validate a schema (or stringified schema)|`(schema: Schema \| string )`|
|`import {validate} from "@dockstat/validator"`|Validate a  Schema|


## Usage

[WORK IN PROGESS]

##

To install dependencies:

```bash
bun install
cargo install
```
