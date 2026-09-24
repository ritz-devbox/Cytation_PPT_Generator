import type PptxGenJS from "pptxgenjs";
import type { PresentationConfig } from "../../../domain/models/PresentationConfig";
import type { SlideDefinition } from "../../../domain/models/SlideDefinition";
import { CircularImageBuilder } from "./CircularImageBuilder";

export class ImageMatrixSlideBuilder {
  public constructor(private readonly imageBuilder: CircularImageBuilder) {}

  public build(slide: PptxGenJS.Slide, definition: SlideDefinition, config: PresentationConfig): void {
    slide.background = { color: "FFFFFF" };
    if (definition.heading) {
      slide.addText(definition.heading.text, {
        x: definition.heading.x,
        y: definition.heading.y,
        w: definition.heading.width,
        h: definition.heading.height,
        fontFace: "Aptos Display",
        fontSize: 20,
        color: "172033",
        bold: true,
        align: "center",
        valign: "middle",
        margin: 0,
        fit: "shrink",
      });
    }
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
        if (cell.annotation && cell.annotationY !== undefined && cell.annotationHeight !== undefined) {
          slide.addText(cell.annotation, {
            x: cell.x,
            y: cell.annotationY,
            w: cell.width,
            h: cell.annotationHeight,
            fontFace: "Aptos",
            fontSize: 9,
            color: "172033",
            align: "center",
            margin: 0,
          });
        }
      }
    }
  }
}
