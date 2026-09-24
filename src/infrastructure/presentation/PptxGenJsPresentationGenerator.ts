import type { IPresentationGenerator } from "../../application/contracts/IPresentationGenerator";
import { PresentationGenerationError } from "../../domain/errors/PresentationGenerationError";
import type { PresentationConfig } from "../../domain/models/PresentationConfig";
import type { GeneratedPresentationFile } from "../../domain/models/PresentationResult";
import type { SlideDefinition } from "../../domain/models/SlideDefinition";
import { ImageMatrixSlideBuilder } from "./builders/ImageMatrixSlideBuilder";

const powerpointMimeType =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

export class PptxGenJsPresentationGenerator implements IPresentationGenerator {
  public constructor(private readonly slideBuilder: ImageMatrixSlideBuilder) {}

  public async generate(
    slides: readonly SlideDefinition[],
    config: PresentationConfig,
  ): Promise<GeneratedPresentationFile> {
    try {
      const { default: PptxGenJS } = await import("pptxgenjs");
      const presentation = new PptxGenJS();
      const layoutName = "CYTATION_CUSTOM";
      presentation.defineLayout({
        name: layoutName,
        width: config.slideWidth,
        height: config.slideHeight,
      });
      presentation.layout = layoutName;
      presentation.author = "Cytation PowerPoint Generator";
      presentation.company = "";
      presentation.subject = "Cytation image matrix";
      presentation.title = "Cytation image matrix";

      for (const definition of slides) {
        const slide = presentation.addSlide();
        this.slideBuilder.build(slide, definition, config);
      }

      const output = await presentation.write({ outputType: "uint8array", compression: true });
      if (!(output instanceof Uint8Array)) {
        throw new Error("PptxGenJS returned an unexpected output type.");
      }
      return { bytes: output, mimeType: powerpointMimeType };
    } catch (error) {
      throw new PresentationGenerationError(undefined, { cause: error });
    }
  }
}
