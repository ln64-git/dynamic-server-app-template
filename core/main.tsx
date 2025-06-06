#!/usr/bin/env bun
import { render } from "ink";
import { SampleClass } from "../src/SampleClass";
import { cliToState, runDynamicApp } from "@core/app";
import { AppCli } from "@core/cli";

const instance = new SampleClass();
const { returnOutput } = cliToState(instance.getState());

await runDynamicApp(instance);

// Only render the UI if --return is NOT present
if (!returnOutput) {
  render(<AppCli app={instance} />);
}
