import type PptxGenJS from "pptxgenjs";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_PRESENTATION_CONFIG } from "../../src/domain/models/PresentationConfig";
import type { SlideDefinition } from "../../src/domain/models/SlideDefinition";
import { CircularImageBuilder } from "../../src/infrastructure/presentation/builders/CircularImageBuilder";
import { ImageMatrixSlideBuilder } from "../../src/infrastructure/presentation/builders/ImageMatrixSlideBuilder";
import { inputFile } from "../helpers/files";

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

  it("renders a first-slide heading and a count below its image", () => {
    const addText = vi.fn();
    const slide = {
      background: undefined,
      addText,
      addImage: vi.fn(),
    } as unknown as PptxGenJS.Slide;
    const definition: SlideDefinition = {
      number: 1,
      heading: { text: "Experiment counts", x: 0.35, y: 0.35, width: 9.3, height: 0.42 },
      rows: [
        {
          key: "B:first",
          datasetName: "first",
          label: "First",
          labelX: 0.35,
          labelY: 1,
          labelWidth: 0.67,
          height: 1,
          cells: [
            {
              image: {
                datasetName: "first",
                coordinate: { row: "B", column: 2 },
                file: inputFile("first", "B2"),
                annotation: "0",
              },
              x: 1.1,
              y: 1,
              width: 1,
              height: 1,
              annotation: "0",
              annotationY: 2.02,
              annotationHeight: 0.16,
            },
          ],
        },
      ],
    };

    new ImageMatrixSlideBuilder(new CircularImageBuilder()).build(
      slide,
      definition,
      DEFAULT_PRESENTATION_CONFIG,
    );

    expect(addText).toHaveBeenCalledWith(
      "Experiment counts",
      expect.objectContaining({ align: "center", y: 0.35 }),
    );
    expect(addText).toHaveBeenCalledWith(
      "0",
      expect.objectContaining({ x: 1.1, y: 2.02, align: "center" }),
    );
  });
});
