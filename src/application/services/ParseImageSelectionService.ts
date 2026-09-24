import { datasetNameFromPath, type InputFile } from "../../domain/models/InputFile";
import type { ParsedImage } from "../../domain/models/ParsedImage";
import type { ValidationIssue } from "../../domain/models/ValidationIssue";

export interface ParsedSelection {
  readonly images: readonly ParsedImage[];
  readonly issues: readonly ValidationIssue[];
}

const coordinatePattern = /_([a-z]+)(\d+)_/i;
const supportedExtensions = new Set(["jpg", "jpeg"]);
const companionExtensions = new Set(["xlsx"]);

function extensionOf(filename: string): string {
  return filename.includes(".") ? (filename.split(".").pop()?.toLowerCase() ?? "") : "";
}

export class ParseImageSelectionService {
  public execute(files: readonly InputFile[]): ParsedSelection {
    const images: ParsedImage[] = [];
    const issues: ValidationIssue[] = [];

    for (const file of files) {
      const extension = extensionOf(file.name);
      if (companionExtensions.has(extension)) {
        continue;
      }
      if (!supportedExtensions.has(extension)) {
        issues.push({
          code: "unsupported-file",
          severity: "warning",
          message: `${file.name} was ignored because it is not a JPG image.`,
          filename: file.name,
        });
        continue;
      }

      if (!file.content) {
        issues.push({
          code: "unreadable-file",
          severity: "error",
          message: `${file.name} could not be read.`,
          filename: file.name,
        });
        continue;
      }

      const match = coordinatePattern.exec(file.name);
      if (!match) {
        issues.push({
          code: "invalid-coordinate",
          severity: "error",
          message: `${file.name} does not contain a coordinate such as _B2_.`,
          filename: file.name,
        });
        continue;
      }

      images.push({
        datasetName: datasetNameFromPath(file.relativePath),
        coordinate: {
          row: match[1].toUpperCase(),
          column: Number.parseInt(match[2], 10),
        },
        file,
      });
    }

    return { images, issues };
  }
}
