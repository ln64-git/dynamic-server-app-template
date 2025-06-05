#!/usr/bin/env bun
import { render } from "ink";
import { SampleClass } from "../src/SampleClass";
import { runDynamicApp } from "@core/app";
import { AppCli } from "@core/cli";

const instance = new SampleClass();

runDynamicApp(instance);

render(<AppCli app={instance} />);
