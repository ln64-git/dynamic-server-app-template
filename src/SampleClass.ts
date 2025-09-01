import { DynamicServerApp } from "../core/app";

export interface SampleState {
  port: number;
  message: string;
}

export class SampleClass extends DynamicServerApp<SampleState> {
  port = 2000;

  message = "Hello, world!";

  async defaultFunction(): Promise<string> {
    return (this.message + " called from defaultFunction");
  }

}