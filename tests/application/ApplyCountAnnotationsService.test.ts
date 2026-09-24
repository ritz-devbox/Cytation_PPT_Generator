import { describe, expect, it } from "vitest";
import { ApplyCountAnnotationsService } from "../../src/application/services/ApplyCountAnnotationsService";
import { ParseImageSelectionService } from "../../src/application/services/ParseImageSelectionService";
import type { CountWorkbookData } from "../../src/domain/models/CountWorkbookData";
import { coordinateKey } from "../../src/domain/models/ImageCoordinate";
import { inputFile } from "../helpers/files";

const parser = new ParseImageSelectionService();
const service = new ApplyCountAnnotationsService();

const workbook: CountWorkbookData = {
  filename: "counts.xlsx",
  rows: [
    [null, 1, 2],
    ["B", 0, 23],
    [null],
    [null, 1, 2],
    ["B", 15, 19],
  ],
};

describe("ApplyCountAnnotationsService", () => {
  it("maps workbook blocks to folders by folder order and coordinates directly", () => {
    const parsed = parser.execute([
      inputFile("second", "B1"),
      inputFile("second", "B2"),
      inputFile("first", "B1"),
      inputFile("first", "B2"),
    ]);

    const result = service.execute(parsed, [workbook]);
    const annotations = Object.fromEntries(
      result.images.map((image) => [
        `${image.datasetName}:${coordinateKey(image.coordinate)}`,
        image.annotation,
      ]),
    );

    expect(annotations).toEqual({
      "second:B1": "15",
      "second:B2": "19",
      "first:B1": "0",
      "first:B2": "23",
    });
  });

  it("warns but leaves images usable when no workbook was selected", () => {
    const parsed = parser.execute([inputFile("sample", "B2")]);

    const result = service.execute(parsed, []);

    expect(result.images[0].annotation).toBeUndefined();
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "missing-count-workbook", severity: "warning" }),
    );
  });

  it("warns when there are fewer blocks than image folders", () => {
    const parsed = parser.execute([
      inputFile("first", "B2"),
      inputFile("second", "B2"),
      inputFile("third", "B2"),
    ]);

    const result = service.execute(parsed, [workbook]);

    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "missing-count-block", severity: "warning" }),
    );
  });
});
