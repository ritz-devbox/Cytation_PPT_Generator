import type { IFileReader } from "../contracts/IFileReader";
import type { PresentationConfig } from "../../domain/models/PresentationConfig";
import type { PresentationResult } from "../../domain/models/PresentationResult";
import type { PreparedImageSelection } from "../../domain/models/PreparedImageSelection";
import type { SlideLayoutResult } from "../../domain/models/SlideDefinition";
import {
  BuildSlideLayoutService,
  type EditableRowLabel,
} from "../services/BuildSlideLayoutService";
import { GeneratePresentationService } from "../services/GeneratePresentationService";
import { ParseImageSelectionService } from "../services/ParseImageSelectionService";
import { ValidateImageMatrixService } from "../services/ValidateImageMatrixService";

export class PresentationController<TSource> {
  public constructor(
    private readonly fileReader: IFileReader<TSource>,
    private readonly parser: ParseImageSelectionService,
    private readonly validator: ValidateImageMatrixService,
    private readonly layoutBuilder: BuildSlideLayoutService,
    private readonly generator: Pick<GeneratePresentationService, "execute">,
  ) {}

  public async prepare(sources: readonly TSource[]): Promise<PreparedImageSelection> {
    const files = await this.fileReader.readFiles(sources);
    return this.validator.execute(this.parser.execute(files));
  }

  public buildPreview(
    selection: PreparedImageSelection,
    config: PresentationConfig,
    labels: Readonly<Record<string, string>>,
  ): SlideLayoutResult {
    return this.layoutBuilder.execute({ selection, config, labels });
  }

  public getEditableRows(
    selection: PreparedImageSelection,
    orientation: PresentationConfig["orientation"],
  ): readonly EditableRowLabel[] {
    return this.layoutBuilder.getEditableRows(selection, orientation);
  }

  public generate(
    slides: SlideLayoutResult["slides"],
    config: PresentationConfig,
    filename: string,
  ): Promise<PresentationResult> {
    return this.generator.execute({ slides, config, filename });
  }
}
