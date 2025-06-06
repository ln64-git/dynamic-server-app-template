import { z } from "zod";
import { DynamicServerApp } from "../core/app";

export type SampleState = z.infer<typeof SampleSchema>;
export const SampleSchema = z.object({
  port: z.number(),
  message: z.string(),
});

export class SampleClass extends DynamicServerApp<SampleState> {
  schema = SampleSchema;
  port = 2000;

  message = "Hello, world!";

  async sampleFunction(): Promise<string> {
    return (this.message + " called from sampleFunction");
  }
  
}