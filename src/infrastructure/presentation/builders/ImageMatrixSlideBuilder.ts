import type PptxGenJS from "pptxgenjs";
import type { PresentationConfig } from "../../../domain/models/PresentationConfig";
import type { SlideDefinition } from "../../../domain/models/SlideDefinition";
import { CircularImageBuilder } from "./CircularImageBuilder";

export class ImageMatrixSlideBuilder {
  public constructor(private readonly imageBuilder: CircularImageBuilder) {}

  public build(slide: PptxGenJS.Slide, definition: SlideDefinition, config: PresentationConfig): void {
    slide.background = { color: "FFFFFF" };
    for (const row of definition.rows) {
      slide.addText(row.label, {
        x: row.labelX,
        y: row.labelY,
        w: row.labelWidth,
        h: row.height,
        fontFace: "Aptos",
        fontSize: config.labelFontSize,
        color: "172033",
        bold: true,
        valign: "middle",
        align: "center",
        vert: "vert270",
        margin: 0,
        breakLine: false,
        fit: "shrink",
      });
      for (const cell of row.cells) {
        this.imageBuilder.add(slide, cell);
        if (cell.annotation) {
          slide.addText(cell.annotation, {
            x: cell.x,
            y: Math.max(0, cell.y - 0.22),
            w: cell.width,
            h: 0.18,
            fontFace: "Aptos",
            fontSize: 10,
            color: "172033",
            align: "center",
            margin: 0,
          });
        }
      }
    }
  }
}
