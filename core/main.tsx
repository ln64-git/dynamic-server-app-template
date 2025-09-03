#!/usr/bin/env bun
import { SampleClass } from "../src/SampleClass";
import { runDynamicApp } from "@core/app";

const instance = new SampleClass();

await runDynamicApp(instance);
