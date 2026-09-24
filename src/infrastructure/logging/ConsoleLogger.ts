import type { ILogger } from "../../application/contracts/ILogger";

export class ConsoleLogger implements ILogger {
  public info(message: string, context?: Readonly<Record<string, unknown>>): void {
    console.info(message, context ?? {});
  }

  public error(message: string, error?: unknown, context?: Readonly<Record<string, unknown>>): void {
    console.error(message, { ...context, error });
  }
}
