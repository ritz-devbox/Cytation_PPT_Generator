import { ApplicationError } from "./ApplicationError";

export class ValidationError extends ApplicationError {
  public constructor(message: string) {
    super(message, "validation-error");
    this.name = "ValidationError";
  }
}
