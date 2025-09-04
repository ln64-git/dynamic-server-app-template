import { DynamicServerApp, type ExtractState } from "../core/app";

export class SampleClass extends DynamicServerApp<ExtractState<SampleClass>> {
  message = "Hello, world!";

  async defaultFunction(): Promise<string> {
    return `${this.message}`;
  }

  async greet(name: string): Promise<string> {
    return `Hello, ${name}! Message: ${this.message}`;
  }
}