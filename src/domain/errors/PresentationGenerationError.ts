import { ApplicationError } from "./ApplicationError";

export class PresentationGenerationError extends ApplicationError {
  public constructor(message = "The PowerPoint file could not be generated.", options?: ErrorOptions) {
    super(message, "presentation-generation-error", options);
    this.name = "PresentationGenerationError";
  }
}
