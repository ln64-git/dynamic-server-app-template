import { App } from "../core/app";

export class SampleClass extends App {
  message = "Hello, world!";

  async defaultFunction(): Promise<string> {
    return `${this.message}`;
  }

  async greet(name: string): Promise<string> {
    return `Hello, ${name}! Message: ${this.message}`;
  }
}
