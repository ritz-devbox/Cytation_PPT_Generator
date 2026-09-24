import { ApplicationError } from "./ApplicationError";

export class FileReadError extends ApplicationError {
  public constructor(filename: string, options?: ErrorOptions) {
    super(`Could not read ${filename}. Please select the folder again.`, "file-read-error", options);
    this.name = "FileReadError";
  }
}
