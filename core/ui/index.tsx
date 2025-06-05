#!/usr/bin/env bun
import React from "react";
import { render } from "ink";
import App from "./App";
import { SampleClass } from "../../src/SampleClass";
import { runDynamicApp } from "../app";

const instance = new SampleClass();

runDynamicApp(instance); // ensure server is running

render(<App app={instance} />);
