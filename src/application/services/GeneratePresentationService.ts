import type { IFileSaver } from "../contracts/IFileSaver";
import type { ILogger } from "../contracts/ILogger";
import type { IPresentationGenerator } from "../contracts/IPresentationGenerator";
import { PresentationGenerationError } from "../../domain/errors/PresentationGenerationError";
import type { PresentationConfig } from "../../domain/models/PresentationConfig";
import type { PresentationResult } from "../../domain/models/PresentationResult";
import type { SlideDefinition } from "../../domain/models/SlideDefinition";

export interface GeneratePresentationRequest {
  readonly slides: readonly SlideDefinition[];
  readonly config: PresentationConfig;
  readonly filename: string;
}

export class GeneratePresentationService {
  public constructor(
    private readonly generator: IPresentationGenerator,
    private readonly fileSaver: IFileSaver,
    private readonly logger: ILogger,
  ) {}

  public async execute(request: GeneratePresentationRequest): Promise<PresentationResult> {
    if (request.slides.length === 0) {
      throw new PresentationGenerationError("There are no validated images to generate.");
    }

    const filename = this.normalizeFilename(request.filename);
    try {
      const file = await this.generator.generate(request.slides, request.config);
      const saveMethod = await this.fileSaver.save(file, filename);
      const imageCount = request.slides.reduce(
        (total, slide) => total + slide.rows.reduce((rowTotal, row) => rowTotal + row.cells.length, 0),
        0,
      );
      this.logger.info("Presentation generated", {
        slideCount: request.slides.length,
        imageCount,
        saveMethod,
      });
      return { filename, slideCount: request.slides.length, imageCount, saveMethod };
    } catch (error) {
      this.logger.error("Presentation generation failed", error);
      if (error instanceof PresentationGenerationError) {
        throw error;
      }
      throw new PresentationGenerationError(undefined, { cause: error });
    }
  }

  private normalizeFilename(filename: string): string {
    const trimmed = filename.trim() || "cytation-images";
    const invalidCharacters = '<>:"/\\|?*';
    const safe = [...trimmed]
      .map((character) =>
        invalidCharacters.includes(character) || character.charCodeAt(0) < 32 ? "-" : character,
      )
      .join("");
    return safe.toLowerCase().endsWith(".pptx") ? safe : `${safe}.pptx`;
  }
}
