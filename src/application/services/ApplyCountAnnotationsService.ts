import { coordinateKey } from "../../domain/models/ImageCoordinate";
import type { CountWorkbookData, SpreadsheetCell, SpreadsheetRows } from "../../domain/models/CountWorkbookData";
import type { ParsedImage } from "../../domain/models/ParsedImage";
import type { ValidationIssue } from "../../domain/models/ValidationIssue";
import type { ParsedSelection } from "./ParseImageSelectionService";

interface CountBlock {
  readonly values: ReadonlyMap<string, number>;
}

const naturalCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

function integerFrom(cell: SpreadsheetCell | undefined): number | null {
  const value = typeof cell === "number" ? cell : typeof cell === "string" ? Number(cell) : NaN;
  return Number.isInteger(value) && value > 0 ? value : null;
}

function numberFrom(cell: SpreadsheetCell | undefined): number | null {
  const value = typeof cell === "number" ? cell : typeof cell === "string" ? Number(cell) : NaN;
  return Number.isFinite(value) ? value : null;
}

function rowNameFrom(cell: SpreadsheetCell | undefined): string | null {
  if (typeof cell !== "string") {
    return null;
  }
  const value = cell.trim().toUpperCase();
  return /^[A-Z]+$/.test(value) ? value : null;
}

function formatCount(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)));
}

export class ApplyCountAnnotationsService {
  public execute(
    parsed: ParsedSelection,
    workbooks: readonly CountWorkbookData[],
  ): ParsedSelection {
    const issues: ValidationIssue[] = [...parsed.issues];
    if (workbooks.length === 0) {
      issues.push({
        code: "missing-count-workbook",
        severity: "warning",
        message: "No XLSX count workbook was selected. Images will be generated without counts.",
      });
      return { ...parsed, issues };
    }

    const readableWorkbooks = workbooks.filter((workbook) => {
      if (!workbook.readError) {
        return true;
      }
      issues.push({
        code: "invalid-count-workbook",
        severity: "warning",
        message: `${workbook.filename} could not be read. Images will be generated without its counts.`,
        filename: workbook.filename,
      });
      return false;
    });
    const blocks = readableWorkbooks.flatMap((workbook) => this.parseBlocks(workbook.rows));
    const datasets = [...new Set(parsed.images.map((image) => image.datasetName))].sort(
      naturalCollator.compare,
    );

    if (blocks.length < datasets.length) {
      issues.push({
        code: "missing-count-block",
        severity: "warning",
        message: `The workbook contains ${blocks.length} count blocks for ${datasets.length} image folders. Unmatched folders will not show counts.`,
      });
    }

    let missingCoordinateCount = 0;
    const images: ParsedImage[] = parsed.images.map((image) => {
      const datasetIndex = datasets.indexOf(image.datasetName);
      const block = blocks[datasetIndex];
      if (!block) {
        return image;
      }
      const key = coordinateKey(image.coordinate);
      if (!block.values.has(key)) {
        missingCoordinateCount += 1;
        return image;
      }
      const count = block.values.get(key) ?? 0;
      return {
        ...image,
        annotation: formatCount(count),
      };
    });

    if (missingCoordinateCount > 0) {
      issues.push({
        code: "missing-count-coordinate",
        severity: "warning",
        message: `${missingCoordinateCount} images did not have a matching coordinate in the count workbook.`,
      });
    }

    return { images, issues };
  }

  private parseBlocks(rows: SpreadsheetRows): readonly CountBlock[] {
    const blocks: CountBlock[] = [];
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
      const headerRow = rows[rowIndex];
      const columnHeaders = headerRow
        .map((cell, cellIndex) => ({ cellIndex, column: integerFrom(cell) }))
        .filter(
          (header): header is { readonly cellIndex: number; readonly column: number } =>
            header.cellIndex > 0 && header.column !== null,
        );
      if (columnHeaders.length === 0) {
        continue;
      }

      const values = new Map<string, number>();
      let dataRowCount = 0;
      let nextRowIndex = rowIndex + 1;
      for (; nextRowIndex < rows.length; nextRowIndex += 1) {
        const dataRow = rows[nextRowIndex];
        const rowName = rowNameFrom(dataRow[0]);
        if (!rowName) {
          break;
        }
        dataRowCount += 1;
        for (const { cellIndex, column } of columnHeaders) {
          const count = numberFrom(dataRow[cellIndex]);
          if (count !== null) {
            values.set(`${rowName}${column}`, count);
          }
        }
      }

      if (dataRowCount > 0) {
        blocks.push({ values });
        rowIndex = nextRowIndex - 1;
      }
    }
    return blocks;
  }
}
