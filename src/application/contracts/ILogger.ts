export interface ILogger {
  info(message: string, context?: Readonly<Record<string, unknown>>): void;
  error(message: string, error?: unknown, context?: Readonly<Record<string, unknown>>): void;
}
