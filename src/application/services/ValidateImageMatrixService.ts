import { coordinateKey } from "../../domain/models/ImageCoordinate";
import type { ParsedImage } from "../../domain/models/ParsedImage";
import type { PreparedImageSelection } from "../../domain/models/PreparedImageSelection";
import type { ValidationIssue } from "../../domain/models/ValidationIssue";
import type { ParsedSelection } from "./ParseImageSelectionService";

const naturalCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

export class ValidateImageMatrixService {
  public execute(parsed: ParsedSelection): PreparedImageSelection {
    const issues: ValidationIssue[] = [...parsed.issues];
    const datasets = [...new Set(parsed.images.map((image) => image.datasetName))].sort(naturalCollator.compare);
    const coordinateRows = [...new Set(parsed.images.map((image) => image.coordinate.row))].sort(
      naturalCollator.compare,
    );
    const coordinateColumns = [...new Set(parsed.images.map((image) => image.coordinate.column))].sort(
      (left, right) => left - right,
    );

    if (parsed.images.length === 0) {
      issues.push({
        code: "empty-selection",
        severity: "error",
        message: "No valid JPG images were found in the selected folder.",
      });
      return { images: [], datasets, coordinateRows, coordinateColumns, issues };
    }

    const uniqueImages: ParsedImage[] = [];
    const byDataset = new Map<string, Map<string, ParsedImage>>();

    for (const image of parsed.images) {
      const datasetImages = byDataset.get(image.datasetName) ?? new Map<string, ParsedImage>();
      const key = coordinateKey(image.coordinate);
      const existing = datasetImages.get(key);
      if (existing) {
        issues.push({
          code: "duplicate-coordinate",
          severity: "error",
          message: `${image.datasetName} contains more than one image for ${key}.`,
          datasetName: image.datasetName,
          coordinate: key,
          filename: image.file.name,
        });
      } else {
        datasetImages.set(key, image);
        uniqueImages.push(image);
      }
      byDataset.set(image.datasetName, datasetImages);
    }

    for (const datasetName of datasets) {
      const datasetImages = byDataset.get(datasetName) ?? new Map<string, ParsedImage>();
      for (const row of coordinateRows) {
        for (const column of coordinateColumns) {
          const key = `${row}${column}`;
          if (!datasetImages.has(key)) {
            issues.push({
              code: "missing-coordinate",
              severity: "error",
              message: `${datasetName} is missing image ${key}.`,
              datasetName,
              coordinate: key,
            });
          }
        }
      }
    }

    return {
      images: uniqueImages,
      datasets,
      coordinateRows,
      coordinateColumns,
      issues,
    };
  }
}
