export class ApplicationError extends Error {
  public readonly code: string;

  public constructor(message: string, code = "application-error", options?: ErrorOptions) {
    super(message, options);
    this.name = "ApplicationError";
    this.code = code;
  }
}
