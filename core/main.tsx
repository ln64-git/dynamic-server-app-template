#!/usr/bin/env bun
import { SampleClass } from "../src/SampleClass";
import { run } from "@core/app";

const instance = new SampleClass();

await run(instance);
