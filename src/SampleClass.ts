import { DynamicServerApp } from "./app";

interface ServerState {
  port: number;
  message: string;
}

export class SampleClass extends DynamicServerApp<ServerState> {
  port = 1996;
  message = "Hello, world!";

  public async sampleFunction(): Promise<void> {
    console.log(this.message);
  }
}
