import type { GeneratedPresentationFile } from "../../domain/models/PresentationResult";

export interface IFileSaver {
  save(file: GeneratedPresentationFile, filename: string): Promise<"picker" | "download">;
}
