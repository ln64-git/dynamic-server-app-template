import { z } from "zod";
import { DynamicServerApp } from "../core/app";

export class SampleClass extends DynamicServerApp<z.infer<typeof SampleClass.schema>> {
  static schema = z.object({
    port: z.number(),
    message: z.string(),
  });

  schema = SampleClass.schema;
  port = 1996;
  message = "Hello, world!";

  async sampleFunction(): Promise<void> {
    console.log(this.message);
  }
}
