import type PptxGenJS from "pptxgenjs";
import type { PositionedSlideCell } from "../../../domain/models/SlideDefinition";

export class CircularImageBuilder {
  public add(slide: PptxGenJS.Slide, cell: PositionedSlideCell): void {
    const content = cell.image.file.content;
    if (!content) {
      return;
    }
    slide.addImage({
      data: content,
      x: cell.x,
      y: cell.y,
      w: cell.width,
      h: cell.height,
      rounding: true,
      objectName: `${cell.image.datasetName} ${cell.image.coordinate.row}${cell.image.coordinate.column}`,
    });
  }
}
