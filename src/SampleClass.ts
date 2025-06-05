import { z } from "zod";
import { DynamicServerApp } from "../core/app";

export type SampleState = z.infer<typeof SampleSchema>;
export const SampleSchema = z.object({
  port: z.number(),
});

export class SampleClass extends DynamicServerApp<SampleState> {
  schema = SampleSchema;
  port = 2000;
  message = "Hello, world!";

  async sampleFunction(): Promise<void> {
    console.log(this.message);
  }
}
