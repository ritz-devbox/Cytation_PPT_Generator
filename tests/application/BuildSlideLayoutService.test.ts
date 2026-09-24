import { describe, expect, it } from "vitest";
import { BuildSlideLayoutService } from "../../src/application/services/BuildSlideLayoutService";
import { ParseImageSelectionService } from "../../src/application/services/ParseImageSelectionService";
import { ValidateImageMatrixService } from "../../src/application/services/ValidateImageMatrixService";
import { DEFAULT_PRESENTATION_CONFIG } from "../../src/domain/models/PresentationConfig";
import { inputFile } from "../helpers/files";

const parser = new ParseImageSelectionService();
const validator = new ValidateImageMatrixService();
const layoutBuilder = new BuildSlideLayoutService();

function completeSelection() {
  const files = ["0gy", "2gy"].flatMap((dataset) =>
    ["B", "C"].flatMap((row) => [2, 3, 4].map((column) => inputFile(dataset, `${row}${column}`))),
  );
  return validator.execute(parser.execute(files));
}

function rowCoordinates(row: ReturnType<BuildSlideLayoutService["execute"]>["slides"][number]["rows"][number]) {
  return row.cells.map((cell) => `${cell.image.coordinate.row}${cell.image.coordinate.column}`);
}

describe("BuildSlideLayoutService", () => {
  it("defaults to a maximum of three rows per slide", () => {
    const result = layoutBuilder.execute({
      selection: completeSelection(),
      config: DEFAULT_PRESENTATION_CONFIG,
      labels: {},
    });

    expect(result.rowsPerSlide).toBe(3);
    expect(result.slides.map((slide) => slide.rows.length)).toEqual([3, 1]);
  });

  it("resizes images vertically when configured for more rows per slide", () => {
    const result = layoutBuilder.execute({
      selection: completeSelection(),
      config: { ...DEFAULT_PRESENTATION_CONFIG, maxRowsPerSlide: 4 },
      labels: {},
    });

    expect(result.rowsPerSlide).toBe(4);
    expect(result.slides).toHaveLength(1);
    expect(result.slides[0].rows).toHaveLength(4);
    expect(result.actualDiameter).toBeLessThan(DEFAULT_PRESENTATION_CONFIG.preferredDiameter);
  });

  it("interleaves datasets within each coordinate row in horizontal mode", () => {
    const result = layoutBuilder.execute({
      selection: completeSelection(),
      config: DEFAULT_PRESENTATION_CONFIG,
      labels: { "B:0gy": "Untreated B", "C:0gy": "Untreated C" },
    });
    const rows = result.slides.flatMap((slide) => slide.rows);

    expect(rows.map((row) => row.key)).toEqual(["B:0gy", "B:2gy", "C:0gy", "C:2gy"]);
    expect(rowCoordinates(rows[0])).toEqual(["B2", "B3", "B4"]);
    expect(rows[0].label).toBe("Untreated B");
    expect(rows[1].label).toBe("2gy");
    expect(rows[2].label).toBe("Untreated C");
  });

  it("transposes coordinates and preserves dataset interleaving in vertical mode", () => {
    const result = layoutBuilder.execute({
      selection: completeSelection(),
      config: { ...DEFAULT_PRESENTATION_CONFIG, orientation: "vertical" },
      labels: {},
    });
    const rows = result.slides.flatMap((slide) => slide.rows);

    expect(rows.map((row) => row.key)).toEqual([
      "2:0gy", "2:2gy", "3:0gy", "3:2gy", "4:0gy", "4:2gy",
    ]);
    expect(rowCoordinates(rows[0])).toEqual(["B2", "C2"]);
  });

  it("shrinks circles to keep a complete row on one slide", () => {
    const selection = validator.execute(
      parser.execute(Array.from({ length: 10 }, (_, index) => inputFile("0gy", `B${index + 2}`))),
    );
    const result = layoutBuilder.execute({
      selection,
      config: DEFAULT_PRESENTATION_CONFIG,
      labels: {},
    });

    expect(result.imagesPerRow).toBe(10);
    expect(result.actualDiameter).toBeLessThan(2.1);
    expect(result.slides[0].rows[0].cells).toHaveLength(10);
  });

  it("reserves first-slide heading space and positions counts below images", () => {
    const baseSelection = completeSelection();
    const selection = {
      ...baseSelection,
      images: baseSelection.images.map((image, index) => ({
        ...image,
        annotation: index === 0 ? "23" : undefined,
      })),
    };
    const result = layoutBuilder.execute({
      selection,
      config: { ...DEFAULT_PRESENTATION_CONFIG, firstSlideHeading: "Experiment counts" },
      labels: {},
    });

    expect(result.slides[0].heading?.text).toBe("Experiment counts");
    expect(result.slides[1].heading).toBeUndefined();
    expect(result.slides[0].rows[0].labelY).toBeGreaterThan(DEFAULT_PRESENTATION_CONFIG.marginTop);
    const annotatedCell = result.slides[0].rows[0].cells[0];
    expect(annotatedCell.annotation).toBe("23");
    expect(annotatedCell.annotationY).toBeGreaterThanOrEqual(
      annotatedCell.y + annotatedCell.height,
    );
  });
});
