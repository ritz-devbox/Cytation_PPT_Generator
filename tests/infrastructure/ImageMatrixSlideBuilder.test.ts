import type PptxGenJS from "pptxgenjs";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_PRESENTATION_CONFIG } from "../../src/domain/models/PresentationConfig";
import type { SlideDefinition } from "../../src/domain/models/SlideDefinition";
import { CircularImageBuilder } from "../../src/infrastructure/presentation/builders/CircularImageBuilder";
import { ImageMatrixSlideBuilder } from "../../src/infrastructure/presentation/builders/ImageMatrixSlideBuilder";

describe("ImageMatrixSlideBuilder", () => {
  it("renders every row label rotated 90 degrees to the left of its images", () => {
    const addText = vi.fn();
    const slide = {
      background: undefined,
      addText,
      addImage: vi.fn(),
    } as unknown as PptxGenJS.Slide;
    const definition: SlideDefinition = {
      number: 1,
      rows: [
        {
          key: "B:0gy",
          datasetName: "0gy",
          label: "Label 1",
          labelX: 0.35,
          labelY: 0.35,
          labelWidth: 0.67,
          height: 0.75,
          cells: [],
        },
      ],
    };

    new ImageMatrixSlideBuilder(new CircularImageBuilder()).build(
      slide,
      definition,
      DEFAULT_PRESENTATION_CONFIG,
    );

    expect(addText).toHaveBeenCalledWith(
      "Label 1",
      expect.objectContaining({
        x: 0.35,
        y: 0.35,
        w: 0.67,
        h: 0.75,
        align: "center",
        vert: "vert270",
      }),
    );
  });
});
