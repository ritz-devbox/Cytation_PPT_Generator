import { describe, expect, it } from "vitest";
import { ParseImageSelectionService } from "../../src/application/services/ParseImageSelectionService";
import { ValidateImageMatrixService } from "../../src/application/services/ValidateImageMatrixService";
import { inputFile } from "../helpers/files";

describe("image selection parsing and validation", () => {
  const parser = new ParseImageSelectionService();
  const validator = new ValidateImageMatrixService();

  it("extracts datasets and coordinates from filename substrings", () => {
    const result = validator.execute(
      parser.execute([
        inputFile("0gy", "B2"),
        inputFile("0gy", "B10"),
        inputFile("2gy", "B2"),
        inputFile("2gy", "B10"),
      ]),
    );

    expect(result.datasets).toEqual(["0gy", "2gy"]);
    expect(result.coordinateRows).toEqual(["B"]);
    expect(result.coordinateColumns).toEqual([2, 10]);
    expect(result.issues).toEqual([]);
  });

  it("reports duplicate and missing coordinates as blocking issues", () => {
    const duplicate = inputFile("0gy", "B2", { name: "Duplicate_B2_1.jpg" });
    const result = validator.execute(
      parser.execute([
        inputFile("0gy", "B2"),
        duplicate,
        inputFile("0gy", "B3"),
        inputFile("2gy", "B2"),
      ]),
    );

    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "duplicate-coordinate", datasetName: "0gy", coordinate: "B2" }),
        expect.objectContaining({ code: "missing-coordinate", datasetName: "2gy", coordinate: "B3" }),
      ]),
    );
  });

  it("ignores non-JPG files with a warning", () => {
    const matrixFile = inputFile("0gy", "B2", {
      name: "counts.csv",
      content: null,
    });
    const result = parser.execute([inputFile("0gy", "B2"), matrixFile]);

    expect(result.images).toHaveLength(1);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "unsupported-file", severity: "warning" }),
    );
  });
});
