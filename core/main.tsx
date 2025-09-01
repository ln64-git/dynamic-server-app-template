#!/usr/bin/env bun
import { render } from "ink";
import { SampleClass } from "../src/SampleClass";
import { cliToState, runDynamicApp } from "@core/app";
import { AppCli } from "@core/cli";

const instance = new SampleClass();
const { command, serve } = cliToState(instance.getState());

await runDynamicApp(instance);

// Show UI if:
// 1. --serve flag is present
// 2. cli command is used
// 3. no command and no defaultFunction exists
const shouldShowUI = serve || command === "cli" || 
  (!command && typeof (instance as any).defaultFunction !== "function");

if (shouldShowUI) {
  render(<AppCli app={instance} />);
}
