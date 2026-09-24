import type { GeneratedPresentationFile } from "../../domain/models/PresentationResult";
import type { PresentationConfig } from "../../domain/models/PresentationConfig";
import type { SlideDefinition } from "../../domain/models/SlideDefinition";

export interface IPresentationGenerator {
  generate(
    slides: readonly SlideDefinition[],
    config: PresentationConfig,
  ): Promise<GeneratedPresentationFile>;
}
